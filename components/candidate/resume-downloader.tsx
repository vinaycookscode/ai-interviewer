"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File as FileIcon } from "lucide-react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from "docx";
import { saveAs } from "file-saver";
import { toast } from "sonner";

interface ResumeDownloaderProps {
    content: string;
    fileName?: string;
}

export function ResumeDownloader({ content, fileName = "Improved_Resume" }: ResumeDownloaderProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    // --- PDF Generation ---
    const downloadPdf = () => {
        setIsDownloading(true);
        try {
            const doc = new jsPDF();
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);

            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const lineHeight = 6;
            let cursorY = 20;
            let cursorX = margin;

            // Helper to handle bold segments within a text block
            const parseAndRender = (text: string, options: { link?: string } = {}) => {
                // Split by bold markers
                const parts = text.split("**");
                parts.forEach((part, index) => {
                    const isBold = index % 2 === 1;
                    if (!part) return;

                    doc.setFont("helvetica", isBold ? "bold" : "normal");
                    doc.setTextColor(options.link ? "0563C1" : "000000"); // Blue if link, else black

                    const words = part.split(" ");
                    words.forEach((word, wordIndex) => {
                        const suffix = wordIndex < words.length - 1 ? " " : "";
                        const fullWord = word + suffix;
                        const wordWidth = doc.getTextWidth(fullWord);

                        // Line Wrap
                        if (cursorX + wordWidth > pageWidth - margin) {
                            cursorY += lineHeight;
                            cursorX = margin;
                            if (cursorY > 280) {
                                doc.addPage();
                                cursorY = 20;
                            }
                        }

                        // Render
                        if (options.link) {
                            // @ts-ignore - jsPDF types sometimes miss the url option in text
                            doc.text(fullWord, cursorX, cursorY, { url: options.link });
                            // Underline for link (manual)
                            doc.setDrawColor(5, 99, 193);
                            doc.line(cursorX, cursorY + 1, cursorX + doc.getTextWidth(word), cursorY + 1);
                        } else {
                            doc.text(fullWord, cursorX, cursorY);
                        }

                        cursorX += wordWidth;
                    });
                });
            };

            const lines = content.split("\n");
            lines.forEach((line) => {
                let cleanLine = line.trim();
                let isHeader = false;

                // 1. Header Detection & Cleaning
                const headerMatch = cleanLine.match(/^(#{1,6})\s+(.*)$/);
                if (headerMatch) {
                    cleanLine = headerMatch[2];
                    cleanLine = cleanLine.replace(/^\*\*(.*)\*\*$/, "$1"); // Strip bold wrappers
                    isHeader = true;
                }
                // Bullet cleaning
                else if (cleanLine.match(/^[-*]\s+/)) {
                    cleanLine = "• " + cleanLine.replace(/^[-*]\s+/, ""); // Use visual bullet
                }

                // Horizontal Rule Detection (--- or ***)
                if (cleanLine.match(/^[-*_]{3,}$/)) {
                    if (cursorX !== margin) {
                        cursorY += lineHeight;
                        cursorX = margin;
                    }
                    doc.setDrawColor(200, 200, 200); // Light gray
                    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
                    cursorY += lineHeight;
                    return; // Skip text rendering
                }

                // New Line logic
                if (cursorX !== margin) {
                    cursorY += lineHeight;
                    cursorX = margin;
                }
                if (cursorY > 280) {
                    doc.addPage();
                    cursorY = 20;
                }

                // Render Header
                if (isHeader) {
                    doc.setFontSize(14);
                    doc.setFont("helvetica", "bold");
                    doc.text(cleanLine, cursorX, cursorY);
                    doc.setFontSize(11); // Reset
                    doc.setFont("helvetica", "normal");
                    cursorY += 2; // Extra spacing
                } else {
                    // 2. Link Parsing: [Text](Url)
                    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
                    let lastIndex = 0;
                    let match;

                    while ((match = linkRegex.exec(cleanLine)) !== null) {
                        // Text BEFORE link
                        const preText = cleanLine.substring(lastIndex, match.index);
                        parseAndRender(preText);

                        // LINK Text
                        const linkText = match[1];
                        const linkUrl = match[2];
                        parseAndRender(linkText, { link: linkUrl });

                        lastIndex = linkRegex.lastIndex;
                    }

                    // Text AFTER last link
                    parseAndRender(cleanLine.substring(lastIndex));
                }

                // Line break after paragraph
                cursorY += lineHeight; // Small paragraph spacing
                cursorX = margin;
            });

            doc.save(`${fileName}.pdf`);
            toast.success("Downloaded PDF successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsDownloading(false);
        }
    };

    // --- Helper: Parse Markdown Segments (Links & Bold) ---
    const parseTextSegments = (text: string): (TextRun | ExternalHyperlink)[] => {
        const elements: (TextRun | ExternalHyperlink)[] = [];

        // Regex to match markdown links: [text](url) - Non-greedy
        const linkRegex = /\[(.*?)\]\((.*?)\)/g;
        let lastIndex = 0;
        let match;

        // Iterate through all links found in the text
        while ((match = linkRegex.exec(text)) !== null) {
            // Process text BEFORE the link
            const precedingText = text.substring(lastIndex, match.index);
            if (precedingText) {
                // Split preceding text by bold markers (**)
                const boldSegments = precedingText.split("**");
                boldSegments.forEach((segment, i) => {
                    if (segment) {
                        elements.push(new TextRun({
                            text: segment,
                            bold: i % 2 === 1, // odd segments are bold
                        }));
                    }
                });
            }

            // Process the Link itself
            const linkText = match[1];
            const linkUrl = match[2];
            elements.push(new ExternalHyperlink({
                children: [
                    new TextRun({
                        text: linkText,
                        style: "Hyperlink",
                        underline: { type: "single" }, // Visual cue
                        color: "0563C1" // Standard blue link
                    }),
                ],
                link: linkUrl,
            }));

            lastIndex = linkRegex.lastIndex;
        }

        // Process remaining text AFTER the last link
        const remainingText = text.substring(lastIndex);
        if (remainingText) {
            const boldSegments = remainingText.split("**");
            boldSegments.forEach((segment, i) => {
                if (segment) {
                    elements.push(new TextRun({
                        text: segment,
                        bold: i % 2 === 1,
                    }));
                }
            });
        }

        return elements;
    };


    // --- DOCX Generation ---
    const downloadDocx = async () => {
        setIsDownloading(true);
        try {
            const lines = content.split("\n");
            const docChildren: Paragraph[] = [];

            lines.forEach(line => {
                let cleanLine = line.trim();
                let headingLevel = undefined;
                let isBullet = false;

                // Detect Headings (e.g. # Title or ## Subtitle)
                const headerMatch = cleanLine.match(/^(#{1,6})\s+(.*)$/);
                if (headerMatch) {
                    const level = headerMatch[1].length;
                    switch (level) {
                        case 1: headingLevel = HeadingLevel.HEADING_1; break;
                        case 2: headingLevel = HeadingLevel.HEADING_2; break;
                        default: headingLevel = HeadingLevel.HEADING_3;
                    }
                    cleanLine = headerMatch[2];
                    // Clean bold wrappers on headers if AI matched them (e.g. **## Title**)
                    cleanLine = cleanLine.replace(/^\*\*(.*)\*\*$/, "$1");
                }
                // Detect Bullets
                else if (cleanLine.match(/^[-*]\s+/)) {
                    isBullet = true;
                    cleanLine = cleanLine.replace(/^[-*]\s+/, "");
                }
                // Detect Horizontal Rules (---)
                else if (cleanLine.match(/^[-*_]{3,}$/)) {
                    docChildren.push(
                        new Paragraph({
                            border: {
                                bottom: { color: "999999", space: 1, style: "single", size: 6 }
                            },
                            spacing: { after: 120 },
                        })
                    );
                    return;
                }

                // If line is empty after cleaning, skip (unless it's a spacer? Docx paragraphs handle spacing)
                if (!cleanLine && !headingLevel) return;

                // Parse the inner content (links, bold)
                const children = parseTextSegments(cleanLine);

                // Add Paragraph
                docChildren.push(
                    new Paragraph({
                        children: children,
                        heading: headingLevel,
                        bullet: isBullet ? { level: 0 } : undefined,
                        spacing: {
                            after: 120,
                            before: headingLevel ? 240 : 0 // Add space before headings
                        },
                    })
                );
            });

            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: docChildren,
                    },
                ],
                styles: { // Optional: Add default styles if needed
                    paragraphStyles: [
                        {
                            id: "Normal",
                            name: "Normal",
                            run: {
                                size: 22, // 11pt
                                font: "Arial",
                            }
                        }
                    ]
                }
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${fileName}.docx`);
            toast.success("Downloaded Word Doc successfully");
        } catch (error) {
            console.error("DOCX Generation Error:", error);
            toast.error("Failed to generate DOCX");
        } finally {
            setIsDownloading(false);
        }
    };

    // --- TXT Generation ---
    const downloadTxt = () => {
        setIsDownloading(true);
        try {
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            saveAs(blob, `${fileName}.txt`);
            toast.success("Downloaded Text file successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to download text file");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={isDownloading}>
                    <Download className="h-4 w-4" />
                    Download
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadPdf} disabled={isDownloading}>
                    <FileIcon className="mr-2 h-4 w-4 text-red-500" />
                    PDF Document (.pdf)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadDocx} disabled={isDownloading}>
                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
                    Word Document (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadTxt} disabled={isDownloading}>
                    <FileText className="mr-2 h-4 w-4 text-gray-500" />
                    Text File (.txt)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
