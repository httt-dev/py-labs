export interface ApiTesting {
  method: string;
  path: string;
  oracleEndpoint: string;
  postgreEndpoint: string;
  headers: { [key: string]: string };
  bodyType: string;
  oracleBody: string;
  postgreBody: string;
}

export interface ApiResponse {
  statusCode: number;
  statusText: string;
  responseTime: number;
  body: string;
  headers: { [key: string]: string };
}

export interface TestHistory {
  id: string;
  timestamp: string;
  request: ApiTesting;
  oracleResponse?: ApiResponse;
  postgreResponse?: ApiResponse;
}
