export declare class AntidoteConnection {
    private socket;
    private requests;
    private buffer;
    private port;
    private host;
    requestTimeoutMs: number;
    constructor(port: number, host: string);
    private reconnect();
    close(): void;
    private onConnect();
    private onData(data);
    private readMessagesFromBuffer();
    private handleResponse(code, decoded);
    private handleError(errorCode, errorMsg);
    private onClose(hasError);
    private onError(err);
    private onTimeout();
    private onRequestTimeout();
    private invalidateSocket(err);
    /** rejects all requests, which are still open */
    private rejectPending(err);
    private reject(req, err);
    private resolve(req, response);
    sendRequest(messageCode: number, encodedMessage: ArrayBuffer): Promise<any>;
}
