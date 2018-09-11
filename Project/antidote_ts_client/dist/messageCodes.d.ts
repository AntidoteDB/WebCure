import '../proto/antidote_proto';
export declare module MessageCodes {
    const apbRegUpdate = 107;
    const apbGetRegResp = 108;
    const apbCounterUpdate = 109;
    const apbGetCounterResp = 110;
    const apbOperationResp = 111;
    const apbSetUpdate = 112;
    const apbGetSetResp = 113;
    const apbTxnProperties = 114;
    const apbBoundObject = 115;
    const apbReadObjects = 116;
    const apbUpdateOp = 117;
    const apbUpdateObjects = 118;
    const apbStartTransaction = 119;
    const apbAbortTransaction = 120;
    const apbCommitTransaction = 121;
    const apbStaticUpdateObjects = 122;
    const apbStaticReadObjects = 123;
    const apbStartTransactionResp = 124;
    const apbReadObjectResp = 125;
    const apbReadObjectsResp = 126;
    const apbCommitResp = 127;
    const apbStaticReadObjectsResp = 128;
    var ProtoBuf: any;
    var antidotePb: AntidotePB.ProtoBufBuilder;
    function messageCodeToProto(code: number): any;
}
