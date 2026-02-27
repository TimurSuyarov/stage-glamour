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

export interface ProcessingCompletedPayload {
  message?: string;
  totalItemsRetrieved?: number;
  hasRequiredTransferExist?: boolean;
  timestamp?: string;
}

export function createSalesOrdersHubConnection(): signalR.HubConnection {
  const hubUrl = getHubUrl();
  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => sessionStorage.getItem("token") ?? "",
    })
    .withAutomaticReconnect()
    .build();
}
