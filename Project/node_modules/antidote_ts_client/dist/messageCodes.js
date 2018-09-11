"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../proto/antidote_proto");
const path = require("path");
var MessageCodes;
(function (MessageCodes) {
    MessageCodes.apbRegUpdate = 107;
    MessageCodes.apbGetRegResp = 108;
    MessageCodes.apbCounterUpdate = 109;
    MessageCodes.apbGetCounterResp = 110;
    MessageCodes.apbOperationResp = 111;
    MessageCodes.apbSetUpdate = 112;
    MessageCodes.apbGetSetResp = 113;
    MessageCodes.apbTxnProperties = 114;
    MessageCodes.apbBoundObject = 115;
    MessageCodes.apbReadObjects = 116;
    MessageCodes.apbUpdateOp = 117;
    MessageCodes.apbUpdateObjects = 118;
    MessageCodes.apbStartTransaction = 119;
    MessageCodes.apbAbortTransaction = 120;
    MessageCodes.apbCommitTransaction = 121;
    MessageCodes.apbStaticUpdateObjects = 122;
    MessageCodes.apbStaticReadObjects = 123;
    MessageCodes.apbStartTransactionResp = 124;
    MessageCodes.apbReadObjectResp = 125;
    MessageCodes.apbReadObjectsResp = 126;
    MessageCodes.apbCommitResp = 127;
    MessageCodes.apbStaticReadObjectsResp = 128;
    MessageCodes.ProtoBuf = require("protobufjs");
    var antidoteProtoSrc = path.join(__dirname, '..', 'proto', 'antidote.proto');
    MessageCodes.antidotePb = MessageCodes.ProtoBuf.protoFromFile(antidoteProtoSrc).build("AntidotePB");
    function messageCodeToProto(code) {
        switch (code) {
            case MessageCodes.apbRegUpdate:
                return MessageCodes.antidotePb.ApbRegUpdate;
            case MessageCodes.apbGetRegResp:
                return MessageCodes.antidotePb.ApbGetRegResp;
            case MessageCodes.apbCounterUpdate:
                return MessageCodes.antidotePb.ApbCounterUpdate;
            case MessageCodes.apbGetCounterResp:
                return MessageCodes.antidotePb.ApbGetCounterResp;
            case MessageCodes.apbOperationResp:
                return MessageCodes.antidotePb.ApbOperationResp;
            case MessageCodes.apbSetUpdate:
                return MessageCodes.antidotePb.ApbSetUpdate;
            case MessageCodes.apbGetSetResp:
                return MessageCodes.antidotePb.ApbGetSetResp;
            case MessageCodes.apbTxnProperties:
                return MessageCodes.antidotePb.ApbTxnProperties;
            case MessageCodes.apbBoundObject:
                return MessageCodes.antidotePb.ApbBoundObject;
            case MessageCodes.apbReadObjects:
                return MessageCodes.antidotePb.ApbReadObjects;
            case MessageCodes.apbUpdateOp:
                return MessageCodes.antidotePb.ApbUpdateOp;
            case MessageCodes.apbUpdateObjects:
                return MessageCodes.antidotePb.ApbUpdateObjects;
            case MessageCodes.apbStartTransaction:
                return MessageCodes.antidotePb.ApbStartTransaction;
            case MessageCodes.apbAbortTransaction:
                return MessageCodes.antidotePb.ApbAbortTransaction;
            case MessageCodes.apbCommitTransaction:
                return MessageCodes.antidotePb.ApbCommitTransaction;
            case MessageCodes.apbStaticUpdateObjects:
                return MessageCodes.antidotePb.ApbUpdateObjects;
            case MessageCodes.apbStaticReadObjects:
                return MessageCodes.antidotePb.ApbStaticReadObjects;
            case MessageCodes.apbStartTransactionResp:
                return MessageCodes.antidotePb.ApbStartTransactionResp;
            case MessageCodes.apbReadObjectResp:
                return MessageCodes.antidotePb.ApbReadObjectResp;
            case MessageCodes.apbReadObjectsResp:
                return MessageCodes.antidotePb.ApbReadObjectsResp;
            case MessageCodes.apbCommitResp:
                return MessageCodes.antidotePb.ApbCommitResp;
            case MessageCodes.apbStaticReadObjectsResp:
                return MessageCodes.antidotePb.ApbStaticReadObjectsResp;
        }
        throw new Error(`invalid code: ${code}`);
    }
    MessageCodes.messageCodeToProto = messageCodeToProto;
})(MessageCodes = exports.MessageCodes || (exports.MessageCodes = {}));
//# sourceMappingURL=messageCodes.js.map