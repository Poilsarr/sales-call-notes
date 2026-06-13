import { CRMCall } from "@/types/crm";
import { CRMFormatterService } from "./formatter";
import { refreshIntegrationToken } from "@/lib/integrations/token-refresh";

export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname: string;
    lastname: string;
    phone?: string;
  };
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    dealstage: string;
    amount?: string;
    closedate?: string;
  };
}

export class HubSpotService {
  private baseUrl = "https://api.hubapi.com";
  private formatter = new CRMFormatterService();
  private teamId: string;

  constructor(teamId?: string) {
    this.teamId = teamId || "";
  }

  async syncCall(call: CRMCall) {
    const accessToken = await this.getToken();
    if (!accessToken) throw new Error("HubSpot not connected");

    const contact = await this.createContact(call, accessToken);
    const deal = await this.createDeal(call, contact.id, accessToken);
    await this.createNote(call, deal.id, accessToken);

    return { contactId: contact.id, dealId: deal.id };
  }

  private async getToken(): Promise<string | null> {
    if (!this.teamId) return null;
    return refreshIntegrationToken(this.teamId, "hubspot");
  }

  private async createContact(call: CRMCall, accessToken: string): Promise<HubSpotContact> {
    const contactInfo = this.extractContactInfo(call.transcript || "");

    const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          email: contactInfo.email,
          firstname: contactInfo.firstName,
          lastname: contactInfo.lastName,
          phone: contactInfo.phone,
        },
      }),
    });

    if (!response.ok) throw new Error("Failed to create HubSpot contact");
    return response.json();
  }

  private async createDeal(call: CRMCall, contactId: string, accessToken: string): Promise<HubSpotDeal> {
    const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          dealname: `${call.filename} - ${new Date(call.createdAt).toLocaleDateString()}`,
          dealstage: "appointmentscheduled",
          amount: call.analytics?.budgetMentioned ? "10000" : "0",
          closedate: call.analytics?.timelineMentioned ? call.nextSteps[0]?.date : null,
        },
      }),
    });

    if (!response.ok) throw new Error("Failed to create HubSpot deal");
    return response.json();
  }

  private async createNote(call: CRMCall, dealId: string, accessToken: string) {
    const noteContent = this.formatter.formatNote(call, 'hubspot');

    const response = await fetch(`${this.baseUrl}/crm/v3/objects/notes`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          hs_note_body: noteContent,
          hs_timestamp: Date.now().toString(),
          hs_parent_id: dealId,
          hs_parent_type: "deal",
        },
      }),
    });

    if (!response.ok) throw new Error("Failed to create HubSpot note");
    return response.json();
  }

  private extractContactInfo(transcript: string) {
    const emailMatch = transcript.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = transcript.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);

    return {
      email: emailMatch?.[0] || "",
      firstName: "Contact",
      lastName: "Name",
      phone: phoneMatch?.[0] || "",
    };
  }
}
