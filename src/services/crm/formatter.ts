import { CRMCall } from "@/types/crm";

export class CRMFormatterService {
  formatNote(call: CRMCall, provider: 'hubspot' | 'salesforce' | 'generic' = 'generic'): string {
    const prefix = provider === 'hubspot' ? '🚀 HubSpot' : provider === 'salesforce' ? '☁️ Salesforce' : '📝 CRM';

    let note = `${prefix} CALL LOG\n`;
    note += `========================================\n`;
    note += `📅 Date: ${new Date(call.createdAt).toLocaleDateString()}\n`;
    note += `📄 File: ${call.filename}\n`;
    note += `========================================\n\n`;

    note += `📌 EXECUTIVE SUMMARY\n`;
    note += `${call.summary || "No summary provided."}\n\n`;

    if (call.salesScorecard) {
      note += `🎯 QUALIFICATION SCORECARD\n`;
      note += `----------------------------------------\n`;
      note += `Overall Score: ${call.salesScorecard.overallScore}%\n\n`;

      const frameworks = [
        { key: 'meddic', label: 'MEDDIC' },
        { key: 'bant', label: 'BANT' },
        { key: 'spin', label: 'SPIN' },
      ];

      frameworks.forEach(({ key, label }) => {
        const metrics = call.salesScorecard[key];
        if (metrics) {
          note += `[${label}]\n`;
          Object.entries(metrics).forEach(([metric, data]: [string, any]) => {
            const score = typeof data === 'object' ? data.score : data;
            const evidence = typeof data === 'object' ? data.evidence : '';
            note += `- ${metric}: ${score}/10 ${evidence ? `(${evidence})` : ''}\n`;
          });
          note += `\n`;
        }
      });
      note += `----------------------------------------\n\n`;
    }

    if (call.analytics) {
      note += `📊 QUICK METRICS\n`;
      note += `- Talk Ratio: ${call.analytics.talkRatio || "N/A"}\n`;
      note += `- Sentiment: ${call.analytics.sentiment || "N/A"}\n`;
      note += `- Budget Mentioned: ${call.analytics.budgetMentioned ? "✅" : "❌"}\n`;
      note += `- Timeline Mentioned: ${call.analytics.timelineMentioned ? "✅" : "❌"}\n`;
      note += `- Decision Maker Present: ${call.analytics.decisionMakerPresent ? "✅" : "❌"}\n\n`;
    }

    if (call.actionItems && call.actionItems.length > 0) {
      note += `✅ ACTION ITEMS\n`;
      call.actionItems.forEach((item, i) => {
        note += `${i + 1}. [ ] ${item.task} ${item.owner ? `(Owner: ${item.owner})` : ""} ${item.due ? `(Due: ${item.due})` : ""}\n`;
      });
      note += `\n`;
    }

    if (call.decisions && call.decisions.length > 0) {
      note += `🤝 KEY DECISIONS\n`;
      call.decisions.forEach((d) => {
        note += `- ${d.content}\n`;
      });
      note += `\n`;
    }

    if (call.nextSteps && call.nextSteps.length > 0) {
      note += `⏭️ NEXT STEPS\n`;
      call.nextSteps.forEach((s) => {
        note += `- ${s.step} ${s.date ? `(By: ${s.date})` : ""}\n`;
      });
      note += `\n`;
    }

    note += `📝 TRANSCRIPT EXCERPT\n`;
    note += `----------------------------------------\n`;
    note += `${call.transcript?.slice(0, 2000)}${call.transcript && call.transcript.length > 2000 ? '...' : ''}\n`;
    note += `----------------------------------------\n`;

    return note;
  }

  formatAsMarkdown(call: CRMCall): string {
    return `
# Call Log: ${call.filename}
**Date:** ${new Date(call.createdAt).toLocaleDateString()}

## Executive Summary
${call.summary || "No summary provided."}

${call.salesScorecard ? `
## Qualification Scorecard
**Overall Score: ${call.salesScorecard.overallScore}%**

${Object.entries(call.salesScorecard).filter(([k]) => k !== 'overallScore').map(([key, value]) => {
  return `### ${key.toUpperCase()}\n${Object.entries(value).map(([m, d]: [string, any]) => `- **${m}**: ${typeof d === 'object' ? d.score : d}/10 ${typeof d === 'object' && d.evidence ? `("${d.evidence}")` : ''}`).join('\n')}`;
}).join('\n\n')}
` : ''}

## Action Items
${call.actionItems.map((item, i) => `${i + 1}. [ ] ${item.task} (Owner: ${item.owner}, Due: ${item.due})`).join('\n')}

## Key Decisions
${call.decisions.map(d => `- ${d.content}`).join('\n')}

## Next Steps
${call.nextSteps.map(s => `- ${s.step} (By: ${s.date})`).join('\n')}

---
## Transcript Excerpt
\`\`\`text
${call.transcript?.slice(0, 2000)}
\`\`\`
`;
  }

  formatAsJSON(call: CRMCall): string {
    return JSON.stringify({
      metadata: {
        filename: call.filename,
        date: call.createdAt,
      },
      summary: call.summary,
      qualification: call.salesScorecard,
      analytics: call.analytics,
      actionItems: call.actionItems,
      decisions: call.decisions,
      nextSteps: call.nextSteps,
      transcriptExcerpt: call.transcript?.slice(0, 2000),
    }, null, 2);
  }
}
