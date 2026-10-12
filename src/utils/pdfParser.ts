/* eslint-disable preserve-caught-error */
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Sirf pehle 5 pages parse karo (zyada tar resumes 1-2 page ke hote hain)
    const pagesToParse = Math.min(pdf.numPages, 5);
    
    for (let pageNum = 1; pageNum <= pagesToParse; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    // Clean karo
    let cleanText = fullText.replace(/\s+/g, ' ').trim();
    
    // 🔥 IMPORTANT: Text ko 8000 characters tak limit karo
    if (cleanText.length > 8000) {
      cleanText = cleanText.substring(0, 8000);
      console.log('⚠️ Resume text truncated to 8000 characters');
    }
    
    console.log(`✅ PDF parsed: ${cleanText.length} characters extracted`);
    
    return cleanText;
    
  } catch (error) {
    console.error('PDF Parsing Error:', error);
    throw new Error('PDF parse nahi ho paya. Kya ye valid PDF file hai?');
  }
}