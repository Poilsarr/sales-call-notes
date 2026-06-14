import prisma from "@/lib/prisma";
import { refreshIntegrationToken } from "@/lib/integrations/token-refresh";

type TeamsConfig = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
  tokenType?: string;
};

type MeetingResponse = {
  id: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  joinUrl: string;
  participants?: Array<{ upn: string; role: string }>;
};

type CreateMeetingInput = {
  subject: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
};

export class TeamsService {
  constructor(private teamId: string) {}

  private async getToken(): Promise<string | null> {
    if (!this.teamId) return null;
    return refreshIntegrationToken(this.teamId, "teams");
  }

  private async getConfig(): Promise<TeamsConfig | null> {
    if (!this.teamId) return null;

    const integration = await prisma.integration.findFirst({
      where: { teamId: this.teamId, provider: "teams", enabled: true },
    });

    if (!integration?.config) return null;

    try {
      return JSON.parse(integration.config) as TeamsConfig;
    } catch {
      return null;
    }
  }

  async listMeetings(): Promise<MeetingResponse[]> {
    const accessToken = await this.getToken();
    if (!accessToken) throw new Error("Teams not connected");

    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/onlineMeetings",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to list Teams meetings");
    }

    const data = (await response.json()) as {
      value: Array<{
        id: string;
        subject: string;
        startDateTime: string;
        endDateTime: string;
        joinUrl: string;
        participants?: Array<{ upn: string; role: string }>;
      }>;
    };

    return data.value ?? [];
  }

  async createMeeting(
    subject: string,
    startTime: string,
    endTime: string,
    attendees?: string[],
  ): Promise<MeetingResponse> {
    const accessToken = await this.getToken();
    if (!accessToken) throw new Error("Teams not connected");

    const body: Record<string, unknown> = {
      subject,
      startDateTime: startTime,
      endDateTime: endTime,
    };

    if (attendees && attendees.length > 0) {
      body.participants = {
        attendees: attendees.map((email) => ({
          upn: email,
          role: "attendee",
        })),
      };
    }

    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/onlineMeetings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create Teams meeting");
    }

    const data = (await response.json()) as {
      id: string;
      subject: string;
      startDateTime: string;
      endDateTime: string;
      joinUrl: string;
      participants?: Array<{ upn: string; role: string }>;
    };

    return {
      id: data.id,
      subject: data.subject,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      joinUrl: data.joinUrl,
      participants: data.participants,
    };
  }
}
