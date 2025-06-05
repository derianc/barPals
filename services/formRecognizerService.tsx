import { AzureKeyCredential, DocumentAnalysisClient, DocumentField } from "@azure/ai-form-recognizer";

//const [result, setResult] = useState<string | null>(null);

const endpoint = "https://receipt-analyzer-2.cognitiveservices.azure.com/";
const apiKey = "7Mai1045wUJly6zEB0bchsSQTjXvQD9oelkyyUhGttdpIZc9hYFUJQQJ99BFACYeBjFXJ3w3AAALACOGqK60";

export async function analyzeReceipt(documentUrl: string) {
  try {
    const client = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );
    
    console.log("Analyzing document...");

    // Use the prebuilt receipt model (or any other model you prefer)
    const poller = await client.beginAnalyzeDocumentFromUrl(
      "prebuilt-receipt",
      documentUrl
    );

    const analysisResult = await poller.pollUntilDone();
    console.log("Analysis complete.");

    if (!analysisResult || !analysisResult.documents) {
      throw new Error("No results from the analysis.");
    }

    // Process analysis result
    analysisResult.documents[0]?.fields ?? {};
    return analysisResult;

  } catch (error) {
    console.error("Error analyzing document:", error);
  }
}

