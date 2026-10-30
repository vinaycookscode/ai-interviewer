"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import { AlertCircle, Clock, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { deleteCoachConversation } from "@/actions/coach";
import { UMark } from "@/components/soft-glass/mascot";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { inkButton, label, outlineButton } from "@/components/jobs/employer-ui";
import { MESSAGE_LIMIT } from "@/lib/coach/context";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    fromU: boolean;
    content: string;
}

interface CoachChatProps {
    chats: { id: string; title: string; when: string }[];
    activeId: string | null;
    messages: Message[];
    starters: string[];
    firstName: string | null;
    quota: { limit: number; left: number; free: boolean; resetAt: string };
}

type Status = "idle" | "waiting" | "streaming" | "failed";

const markdown = "flex flex-col gap-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1 [&_code]:rounded [&_code]:bg-sg-chip [&_code]:px-1 [&_a]:underline";

/** Markdown as plain words, for the screen reader announcement. */
const plain = (text: string) => text.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();

/** The chat with Ask U (AIIN-100). Replies stream in; screen readers hear each one once it's finished. */
export function CoachChat({ chats: initialChats, activeId, messages: initialMessages, starters, firstName, quota: initialQuota }: CoachChatProps) {
    const t = useTranslations("Coach");
    const router = useRouter();
    const [chats, setChats] = useState(initialChats);
    const [chatId, setChatId] = useState(activeId);
    const [messages, setMessages] = useState(initialMessages);
    const [quota, setQuota] = useState(initialQuota);
    // A message with no reply after it is one U couldn't answer: it can be tried again
    const [status, setStatus] = useState<Status>(initialMessages.at(-1)?.fromU === false ? "failed" : "idle");
    const [draft, setDraft] = useState("");
    const [announcement, setAnnouncement] = useState("");
    const [deleting, startDeleting] = useTransition();
    const [deleteFailed, setDeleteFailed] = useState(false);
    const [sendFailed, setSendFailed] = useState(false);
    const endRef = useRef<HTMLLIElement>(null);
    const boxRef = useRef<HTMLTextAreaElement>(null);

    const busy = status === "waiting" || status === "streaming";
    const atLimit = quota.left <= 0;
    const tooLong = draft.length > MESSAGE_LIMIT;

    useEffect(() => {
        if (status !== "streaming") endRef.current?.scrollIntoView({ block: "nearest" });
    }, [messages.length, status]);

    /** The message wasn't saved: take it off the page and put it back in the box. */
    function unsend(id: string | undefined, text: string | undefined) {
        if (!id) return;
        setMessages((list) => list.filter((m) => m.id !== id));
        setDraft(text ?? "");
    }

    async function talk(body: { conversationId?: string; message?: string; retry?: true }, mineId?: string) {
        setStatus("waiting");
        setAnnouncement("");
        setSendFailed(false);
        let response: Response | null = null;
        try {
            response = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        } catch {
            // Offline: nothing reached the server
        }
        if (!response?.ok || !response.body) {
            if (response?.status === 429) setQuota((q) => ({ ...q, left: 0 }));
            else setSendFailed(true);
            if (mineId) {
                unsend(mineId, body.message);
                setStatus("idle");
            } else setStatus("failed");
            return;
        }

        const replyId = `reply-${Date.now()}`;
        let reply = "";
        let finished = false;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            for (;;) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (!line.trim()) continue;
                    const event = JSON.parse(line) as { conversation?: { id: string; title: string }; quota?: typeof quota | null; t?: string; done?: true; error?: true };
                    if (event.conversation) {
                        const conversation = event.conversation;
                        if (!chatId) {
                            setChatId(conversation.id);
                            setChats((list) => [{ id: conversation.id, title: conversation.title, when: t("now") }, ...list]);
                            // The address names the chat without reloading the page mid-reply
                            window.history.replaceState(null, "", `/candidate/coach?c=${conversation.id}`);
                        }
                        if (event.quota) setQuota({ ...event.quota, resetAt: String(event.quota.resetAt) });
                    }
                    if (event.t) {
                        reply += event.t;
                        setStatus("streaming");
                        setMessages((list) => (list.at(-1)?.id === replyId ? [...list.slice(0, -1), { id: replyId, fromU: true, content: reply }] : [...list, { id: replyId, fromU: true, content: reply }]));
                    }
                    if (event.done) finished = true;
                }
            }
        } catch {
            finished = false;
        }

        if (finished) {
            setStatus("idle");
            setAnnouncement(t("replyFrom", { text: plain(reply) }));
        } else {
            // A half-written reply isn't kept, on the page or on the server. The message is, to try again.
            setMessages((list) => list.filter((m) => m.id !== replyId));
            setStatus("failed");
        }
    }

    function send(text: string) {
        const message = text.trim();
        if (!message || busy || atLimit || message.length > MESSAGE_LIMIT) return;
        setDraft("");
        if (boxRef.current) boxRef.current.style.height = "";
        const mineId = `mine-${Date.now()}`;
        setMessages((list) => [...list, { id: mineId, fromU: false, content: message }]);
        void talk(chatId ? { conversationId: chatId, message } : { message }, mineId);
    }

    function remove(id: string) {
        setDeleteFailed(false);
        startDeleting(async () => {
            const result = await deleteCoachConversation(id);
            if ("error" in result) {
                setDeleteFailed(true);
                return;
            }
            setChats((list) => list.filter((c) => c.id !== id));
            if (id === chatId) router.push("/candidate/coach");
            else router.refresh();
        });
    }

    const minutesLeft = Math.max(1, Math.ceil((new Date(quota.resetAt).getTime() - Date.now()) / 60_000));

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex max-w-[680px] flex-col gap-2">
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                    <p className="text-lg text-sg-muted">{t("description")}</p>
                </div>
                <Link href="/candidate/coach" className={cn(outlineButton, "h-11 px-5")}>
                    <Plus className="size-4" aria-hidden="true" />
                    {t("newChat")}
                </Link>
            </div>

            <div className="flex flex-wrap items-start gap-5">
                <section
                    aria-label={t("conversation")}
                    className="sg-glass sg-shadow-lg flex min-h-[min(560px,70vh)] min-w-0 flex-[999_1_520px] flex-col gap-4 rounded-[24px] p-4 sm:rounded-[28px] sm:p-6"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-2 py-6 text-center">
                            <UMark className="size-[72px]" />
                            <h2 className="font-display sg-soft text-[26px] leading-8 font-semibold text-balance">
                                {firstName ? t("emptyTitle", { name: firstName }) : t("emptyTitleNoName")}
                            </h2>
                            {!atLimit && <p className="max-w-[420px] text-sg-muted">{t("emptyBody")}</p>}
                            <ul hidden={atLimit} className="flex w-full max-w-[440px] flex-col gap-2">
                                {starters.map((starter) => (
                                    <li key={starter}>
                                        <button
                                            type="button"
                                            onClick={() => send(starter)}
                                            disabled={busy}
                                            className={cn(
                                                "flex min-h-12 w-full items-center gap-2.5 rounded-2xl border border-sg-field-border bg-sg-row px-4 py-2.5 text-left font-semibold hover:bg-sg-chip disabled:opacity-60",
                                                focusRing
                                            )}
                                        >
                                            <Sparkles className="size-4 shrink-0" aria-hidden="true" />
                                            {starter}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <ol aria-label={t("messages")} className="flex flex-1 flex-col gap-3.5">
                            {messages.map((m) =>
                                m.fromU ? (
                                    <li key={m.id} className="flex max-w-[min(620px,100%)] items-start gap-2.5">
                                        <UMark className="size-9 shrink-0" />
                                        <div className="flex min-w-0 flex-col rounded-[20px_20px_20px_6px] bg-(--sg-glass-strong) px-4 py-3 [overflow-wrap:anywhere]">
                                            <span className="sr-only">{t("u")}:</span>
                                            <div className={markdown}>
                                                <ReactMarkdown>{m.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </li>
                                ) : (
                                    <li
                                        key={m.id}
                                        className="max-w-[min(520px,88%)] self-end whitespace-pre-wrap rounded-[20px_20px_6px_20px] bg-sg-ink px-4 py-3 text-sg-ink-foreground [overflow-wrap:anywhere]"
                                    >
                                        <span className="sr-only">{t("you")}: </span>
                                        {m.content}
                                    </li>
                                )
                            )}
                            {status === "waiting" && (
                                <li className="flex items-center gap-2.5">
                                    <UMark className="size-9 shrink-0" />
                                    <span className="rounded-[20px] bg-(--sg-glass-strong) px-4 py-3 text-sg-muted">{t("writing")}</span>
                                </li>
                            )}
                            {status === "failed" && chatId && messages.at(-1)?.fromU === false && (
                                <li role="alert" className="flex flex-wrap items-center gap-2.5 rounded-[18px] bg-sg-row px-4 py-3.5">
                                    <AlertCircle className="size-[18px] shrink-0" aria-hidden="true" />
                                    <span className="flex-[1_1_220px]">{t("failed")}</span>
                                    <button type="button" onClick={() => talk({ conversationId: chatId, retry: true })} className={cn(outlineButton, "h-10 text-sm")}>
                                        {t("retry")}
                                    </button>
                                </li>
                            )}
                            <li ref={endRef} aria-hidden="true" />
                        </ol>
                    )}

                    {/* Each finished reply, read once */}
                    <p role="status" className="sr-only">
                        {announcement}
                    </p>

                    {atLimit ? (
                        <div role="status" className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[18px] bg-sg-row px-4 py-3.5">
                            <Clock className="size-[18px] shrink-0" aria-hidden="true" />
                            <span className="flex-[1_1_240px]" suppressHydrationWarning>
                                {t("limit", {
                                    limit: quota.limit,
                                    plan: quota.free ? t("planFree") : t("planPaid"),
                                    hours: Math.floor(minutesLeft / 60),
                                    minutes: minutesLeft % 60,
                                })}
                            </span>
                            {quota.free && (
                                <Link href="/candidate/pricing" className={cn(inkButton, "h-11 px-5")}>
                                    {t("seePlans")}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                send(draft);
                            }}
                            className="flex flex-col gap-1.5"
                        >
                            <label htmlFor="coach-msg" className="sr-only">
                                {t("label")}
                            </label>
                            {/* The shared focus ring goes round the whole box while the message field has focus */}
                            <div className="flex items-end gap-2 rounded-3xl border border-sg-field-border bg-sg-row py-1.5 pr-1.5 pl-4 has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-sg-focus">
                                <textarea
                                    id="coach-msg"
                                    ref={boxRef}
                                    rows={1}
                                    value={draft}
                                    placeholder={t("placeholder")}
                                    aria-describedby="coach-hint"
                                    aria-invalid={tooLong}
                                    onChange={(e) => {
                                        setDraft(e.target.value);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                            e.preventDefault();
                                            send(draft);
                                        }
                                    }}
                                    className="min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-base leading-6 text-sg-text placeholder:text-sg-muted/80 focus-visible:outline-none"
                                />
                                <button type="submit" aria-label={t("send")} disabled={busy || !draft.trim() || tooLong} className={cn(coralButton, "size-11 shrink-0")}>
                                    <Send className="size-[18px]" aria-hidden="true" />
                                </button>
                            </div>
                            {sendFailed && (
                                <p role="alert" className="text-sm font-semibold text-sg-danger">
                                    {t("sendFailed")}
                                </p>
                            )}
                            <span id="coach-hint" className={cn("text-[13px]", tooLong ? "font-semibold text-sg-danger" : "text-sg-muted")}>
                                {tooLong ? t("tooLong", { limit: MESSAGE_LIMIT }) : t("hint", { left: quota.left, limit: quota.limit })}
                            </span>
                        </form>
                    )}
                </section>

                <aside aria-labelledby="chats-title" className="flex min-w-[min(240px,100%)] max-w-full flex-[1_1_240px] flex-col gap-2.5 lg:order-first lg:max-w-[280px]">
                    <h2 id="chats-title" className={cn(label, "mx-1")}>
                        {t("chats")}
                    </h2>
                    {chats.length ? (
                        <ul className="flex flex-col gap-1.5">
                            {chats.map((chat) => (
                                <li
                                    key={chat.id}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-2xl py-1.5 pr-1.5 pl-3.5",
                                        chat.id === chatId ? "bg-(--sg-glass-strong) shadow-[inset_0_0_0_2px_var(--sg-text)]" : "bg-sg-row"
                                    )}
                                >
                                    <Link
                                        href={`/candidate/coach?c=${chat.id}`}
                                        aria-current={chat.id === chatId ? "page" : undefined}
                                        className={cn("flex min-w-0 flex-1 flex-col rounded-lg", focusRing)}
                                    >
                                        <span className="truncate font-semibold">{chat.title}</span>
                                        <span className="text-[13px] text-sg-muted">{chat.when}</span>
                                    </Link>
                                    <button
                                        type="button"
                                        aria-label={t("delete", { title: chat.title })}
                                        onClick={() => remove(chat.id)}
                                        disabled={deleting}
                                        className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sg-muted hover:bg-sg-chip hover:text-sg-text", focusRing)}
                                    >
                                        <Trash2 className="size-4" aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mx-1 text-sm text-sg-muted">{t("noChats")}</p>
                    )}
                    {deleteFailed && (
                        <p role="alert" className="mx-1 text-sm font-semibold text-sg-danger">
                            {t("deleteFailed")}
                        </p>
                    )}
                </aside>
            </div>
        </div>
    );
}
