import { CRMCall } from "@/types/crm";
import { CRMFormatterService } from "./formatter";

export class SalesforceService {
  private baseUrl: string;
  private formatter = new CRMFormatterService();

  constructor(instanceUrl?: string | null) {
    this.baseUrl = instanceUrl || "https://login.salesforce.com";
  }

  async syncCall(call: CRMCall, accessToken: string) {
    const contact = await this.createContact(call, accessToken);
    const opportunity = await this.createOpportunity(call, contact.id, accessToken);
    await this.createTask(call, opportunity.id, accessToken);

    return { contactId: contact.id, opportunityId: opportunity.id };
  }

  private async createContact(call: CRMCall, accessToken: string) {
    const contactInfo = this.extractContactInfo(call.transcript || "");

    const response = await fetch(`${this.baseUrl}/services/data/v59.0/sobjects/Contact`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        FirstName: contactInfo.firstName,
        LastName: contactInfo.lastName,
        Email: contactInfo.email,
        Phone: contactInfo.phone,
      }),
    });

    if (!response.ok) throw new Error("Failed to create Salesforce contact");
    return response.json();
  }

  private async createOpportunity(call: CRMCall, contactId: string, accessToken: string) {
    const response = await fetch(`${this.baseUrl}/services/data/v59.0/sobjects/Opportunity`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Name: `${call.filename} - ${new Date(call.createdAt).toLocaleDateString()}`,
        StageName: "Prospecting",
        Amount: call.analytics?.budgetMentioned ? 10000 : 0,
        CloseDate: call.analytics?.timelineMentioned ? call.nextSteps[0]?.date : null,
        ContactId: contactId,
      }),
    });

    if (!response.ok) throw new Error("Failed to create Salesforce opportunity");
    return response.json();
  }

  private async createTask(call: CRMCall, opportunityId: string, accessToken: string) {
    const response = await fetch(`${this.baseUrl}/services/data/v59.0/sobjects/Task`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Subject: `Follow up on ${call.filename}`,
        Description: this.formatter.formatNote(call, 'salesforce'),
        Status: "Not Started",
        Priority: "Normal",
        WhatId: opportunityId,
      }),
    });

    if (!response.ok) throw new Error("Failed to create Salesforce task");
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
