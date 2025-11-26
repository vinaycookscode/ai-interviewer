"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useState } from "react";

interface PdfDownloadButtonProps {
    targetId: string;
    fileName: string;
}

export function PdfDownloadButton({ targetId, fileName }: PdfDownloadButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        const element = document.getElementById(targetId);
        if (!element) {
            toast.error("Content not found");
            return;
        }

        setIsGenerating(true);
        try {
            // Clone the element to manipulate it for PDF generation without affecting the UI
            const clone = element.cloneNode(true) as HTMLElement;

            // Style the clone to ensure full visibility
            clone.style.position = "absolute";
            clone.style.top = "-9999px";
            clone.style.left = "0";
            clone.style.width = `${element.offsetWidth}px`;
            clone.style.height = "auto";
            clone.style.overflow = "visible";
            clone.style.zIndex = "-1";

            // Helper to recursively sanitize colors
            const sanitizeColors = (el: HTMLElement) => {
                const style = window.getComputedStyle(el);

                // Sanitize background color
                if (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('lab') || style.backgroundColor.includes('oklab')) {
                    el.style.backgroundColor = '#1a1a1a'; // Fallback dark
                }

                // Sanitize text color
                if (style.color.includes('oklch') || style.color.includes('lab') || style.color.includes('oklab')) {
                    el.style.color = '#ffffff'; // Fallback white
                }

                // Sanitize border color
                if (style.borderColor.includes('oklch') || style.borderColor.includes('lab') || style.borderColor.includes('oklab')) {
                    el.style.borderColor = '#333333'; // Fallback border
                }

                // Sanitize gradients (backgroundImage)
                // Gradients often contain color functions. If we detect unsupported ones, we remove the gradient.
                if (style.backgroundImage !== 'none' &&
                    (style.backgroundImage.includes('oklch') ||
                        style.backgroundImage.includes('lab') ||
                        style.backgroundImage.includes('oklab'))) {
                    el.style.backgroundImage = 'none';
                    // Ensure there's a background color if we remove the image
                    if (el.style.backgroundColor === '' || el.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
                        el.style.backgroundColor = '#1a1a1a';
                    }
                }

                Array.from(el.children).forEach(child => sanitizeColors(child as HTMLElement));
            };

            // Append to body to render
            document.body.appendChild(clone);

            // Sanitize colors BEFORE passing to html2canvas
            sanitizeColors(clone);

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#000000",
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });

            // Remove clone
            document.body.removeChild(clone);

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: [canvas.width, canvas.height],
            });

            pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
            pdf.save(`${fileName}.pdf`);
            toast.success("PDF downloaded successfully");
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isGenerating}
        >
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Download PDF"}
        </Button>
    );
}
