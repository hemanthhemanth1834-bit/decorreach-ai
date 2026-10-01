export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  success: boolean;
  providerMessageId: string | null;
  status: "sent" | "failed" | "not_configured";
  error: string | null;
}

export interface EmailProvider {
  name: string;
  configured: boolean;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
