package com.padhai.backend.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;

@Service
public class PdfWatermarkService {

    public byte[] watermarkPdf(String fileUrl, String watermarkText) throws Exception {
        // Download the original PDF from Cloudinary
        try (InputStream in = new URL(fileUrl).openStream();
             PDDocument document = PDDocument.load(in)) {

            for (PDPage page : document.getPages()) {
                PDPageContentStream cs = new PDPageContentStream(
                        document, page,
                        PDPageContentStream.AppendMode.APPEND, true, true);

                // Make the watermark semi-transparent
                PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
                gs.setNonStrokingAlphaConstant(0.25f);
                cs.setGraphicsStateParameters(gs);

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 14);
                cs.newLineAtOffset(50, 30); // bottom-left of the page
                cs.showText("Licensed to: " + watermarkText);
                cs.endText();
                cs.close();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }
}