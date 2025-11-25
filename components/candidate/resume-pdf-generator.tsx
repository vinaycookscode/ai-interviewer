"use client";

import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ResumePdfGeneratorProps {
    content: string;
    fileName?: string;
}

export function ResumePdfGenerator({ content, fileName = "Improved_Resume.pdf" }: ResumePdfGeneratorProps) {
    const generatePdf = () => {
        const doc = new jsPDF();

        // Set font
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const maxLineWidth = pageWidth - (margin * 2);
        const lineHeight = 6;
        let cursorY = 20;
        let cursorX = margin;

        // Helper to add text and handle wrapping
        const addText = (text: string, isBold: boolean) => {
            doc.setFont("helvetica", isBold ? "bold" : "normal");

            const words = text.split(" ");

            words.forEach((word, index) => {
                const wordWidth = doc.getTextWidth(word + (index < words.length - 1 ? " " : "")); // Add space width if not last word

                if (cursorX + wordWidth > pageWidth - margin) {
                    cursorY += lineHeight;
                    cursorX = margin;

                    if (cursorY > 280) {
                        doc.addPage();
                        cursorY = 20;
                    }
                }

                doc.text(word, cursorX, cursorY);
                cursorX += wordWidth;
                if (index < words.length - 1) { // Add space after word if not the last one
                    cursorX += doc.getTextWidth(" ");
                }
            });
        };

        // Split by newlines first to preserve paragraphs
        const lines = content.split("\n");

        lines.forEach((line) => {
            // Reset X for new line
            if (cursorX !== margin) {
                cursorY += lineHeight;
                cursorX = margin;
            }

            // Check page break
            if (cursorY > 280) {
                doc.addPage();
                cursorY = 20;
            }

            // Split by bold markers
            const segments = line.split("**");

            segments.forEach((segment, index) => {
                // Odd indices are bold (between **)
                const isBold = index % 2 === 1;
                if (segment) {
                    addText(segment, isBold);
                }
            });
            // After processing a line, move to the next line for the next paragraph
            cursorY += lineHeight;
            cursorX = margin;
        });

        doc.save(fileName);
    };

    return (
        <Button onClick={generatePdf} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
        </Button>
    );
}
