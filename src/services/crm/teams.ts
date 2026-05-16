import { CRMCall } from "@/types/crm";

export class TeamsService {
  private baseUrl = "https://graph.microsoft.com/v1.0";

  async syncCall(call: CRMCall, accessToken: string) {
    const note = this.formatNote(call);
    const event = await this.createPlannerTask(call, note, accessToken);
    return { taskId: event.id };
  }

  private async createPlannerTask(call: CRMCall, noteContent: string, accessToken: string) {
    const response = await fetch(`${this.baseUrl}/planner/tasks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `Call Follow-up: ${call.filename}`,
        details: { description: noteContent },
        dueDateTime: call.nextSteps[0]?.date || null,
      }),
    });

    if (!response.ok) throw new Error("Failed to create Teams Planner task");
    return response.json();
  }

  async sendChannelMessage(call: CRMCall, channelId: string, accessToken: string) {
    const message = this.formatChannelMessage(call);

    const response = await fetch(`${this.baseUrl}/teams/${channelId}/channels/General/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: { content: message },
      }),
    });

    if (!response.ok) throw new Error("Failed to send Teams message");
    return response.json();
  }

  private formatNote(call: CRMCall): string {
    let note = `Call Summary: ${call.summary}\n\n`;
    note += `**Action Items:**\n`;
    call.actionItems.forEach((item) => {
      note += `- ${item.task} (Owner: ${item.owner}, Due: ${item.due})\n`;
    });
    note += `\n**Key Decisions:**\n`;
    call.decisions.forEach((decision) => {
      note += `- ${decision.content}\n`;
    });
    note += `\n**Next Steps:**\n`;
    call.nextSteps.forEach((step) => {
      note += `- ${step.step} (Date: ${step.date})\n`;
    });
    return note;
  }

  private formatChannelMessage(call: CRMCall): string {
    let msg = `## Call Notes: ${call.filename}\n\n`;
    msg += `**Summary:** ${call.summary}\n\n`;
    msg += `### Action Items\n`;
    call.actionItems.forEach((item) => {
      msg += `- [ ] **${item.task}** — *${item.owner}* (due: ${item.due})\n`;
    });
    msg += `\n### Key Decisions\n`;
    call.decisions.forEach((d) => {
      msg += `- ${d.content}\n`;
    });
    return msg;
  }
}
