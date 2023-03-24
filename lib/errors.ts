export interface HTTPError extends Error {
  name: string;
  status: number;
  url: string;
}

export interface HTTPTimeout extends Error {
  name: string;
  url: string;
}

export class HTTPError extends Error {
  constructor(response: Response) {
    super(response.statusText);
    this.name = "HTTPError";
    this.status = response.status;
    this.url = response.url;
  }
}

export class HTTPTimeout extends Error {
  constructor() {
    super("Request timed out");
    this.name = "HTTPTimeout";
  }
}
