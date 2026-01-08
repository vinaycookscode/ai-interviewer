"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createCard } from "@/actions/flashcards";
import { useRouter } from "next/navigation";

export function AddCardDialog({ deckId }: { deckId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!front.trim() || !back.trim()) return;

        setLoading(true);
        try {
            await createCard(deckId, front, back);
            setOpen(false);
            setFront("");
            setBack("");
            router.refresh();
        } catch (error) {
            console.error("Failed to create card:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Card
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Card</DialogTitle>
                        <DialogDescription>
                            Create a new flashcard with a question and answer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="front">Front (Question)</Label>
                            <Textarea
                                id="front"
                                placeholder="What is the time complexity of binary search?"
                                value={front}
                                onChange={(e) => setFront(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="back">Back (Answer)</Label>
                            <Textarea
                                id="back"
                                placeholder="O(log n) - Binary search divides the search space in half each step."
                                value={back}
                                onChange={(e) => setBack(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !front.trim() || !back.trim()}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Add Card
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
