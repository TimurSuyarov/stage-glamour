import * as signalR from "@microsoft/signalr";

const BASE_URL = import.meta.env.VITE_BASE_URL ?? "";

function getHubUrl(): string {
  try {
    const base = new URL(BASE_URL);
    return `${base.origin}/hubs/sales-orders`;
  } catch {
    return "/hubs/sales-orders";
  }
}

export interface ReturnCompletedPayload {
  isSuccess: boolean;
  hasRequiredTransferExist: boolean;
  message: string;
  totalItemsRetrieved?: number;
  timestamp?: string;
}

export function createReturnsHubConnection(): signalR.HubConnection {
  const hubUrl = getHubUrl();
  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => sessionStorage.getItem("token") ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .build();
}
