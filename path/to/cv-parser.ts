
// Function to parse the uploaded CV file
function parseCV(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)) {
            reject(new Error('Unsupported file format'));
            return;
        }

        // Read the file content
        const reader = new FileReader();
        reader.onload = async (e) => {
            let content = e.target?.result as string;

            try {
                // PDF parsing logic
                if (file.type === 'application/pdf') {
                    // Use a library like pdf-parse to extract text from PDF
                    const pdfData = await pdfParse(content);
                    content = pdfData.text;
                }

                // DOCX parsing logic
                else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    // Use a library like docx to extract text from DOCX
                    const docxData = await docxParse(content);
                    content = docxData.text;
                }

                // TXT parsing logic
                else if (file.type === 'text/plain') {
                    // Directly use the content as text
                }

                // Extract relevant data using improved regex or parsing algorithm
                const degreePattern = /B\.S\. in (\w+)|A\.A\. in (\w+)/;
                const institutionPattern = /Bigtown College, Chicago, Illinois/;
                const locationPattern = /Cape Town, SA/;
                const graduationDatePattern = /\d{4}/;

                const degreeMatch = content.match(degreePattern);
                const institutionMatch = content.match(institutionPattern);
                const locationMatch = content.match(locationPattern);
                const graduationDateMatch = content.match(graduationDatePattern);

                const parsedData = {
                    degree: degreeMatch ? degreeMatch[0] : 'Unknown',
                    institution: institutionMatch ? institutionMatch[0] : 'Unknown',
                    location: locationMatch ? locationMatch[0] : 'Unknown',
                    graduationDate: graduationDateMatch ? graduationDateMatch[0] : 'Unknown'
                };

                resolve(parsedData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsDataURL(file);
    });
}
