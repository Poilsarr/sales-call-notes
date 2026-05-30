import sys
import json
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import AnonymizerDefinition

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No text provided"}))
        sys.exit(1)

    text = sys.argv[1]

    try:
        # Initialize engines
        analyzer = AnalyzerEngine()
        anonymizer = AnonymizerEngine()

        # Analyze text for PII
        results = analyzer.analyze(text=text, language='en', entities=["PHONE_NUMBER", "EMAIL_ADDRESS", "CREDIT_CARD", "US_SSN", "PERSON", "LOCATION", "DATE_TIME"])

        # Define how to redact (Replacement values)
        # Presidio by default uses [ENTITY_TYPE]

        redacted_result = anonymizer.anonymize(
            text=text,
            analyzer_results=results
        )

        # Extract replacements for the TS service
        replacements = []
        for res in results:
            replacements.append({
                "original": text[res.start:res.end],
                "replacement": f"[{res.entity_type}]",
                "type": res.entity_type
            })

        print(json.dumps({
            "redactedText": redacted_result.text,
            "replacements": replacements
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
