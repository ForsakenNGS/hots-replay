class HotsTrackerEventStructure {

    /**
     * @param {MpqBuffer} buffer
     */
    constructor(buffer) {
        this.dataType = null;
        this.array = null;
        this.dictionary = null;
        this.blob = null;
        this.blobText = null;
        this.choiceFlag = null;
        this.choiceData = null;
        this.optionalData = null;
        this.unsignedInt = null;
        this.variableInt = null;
        this.readFromMpqBuffer(buffer);
    }

    /**
     * @param {MpqBuffer} buffer
     */
    readFromMpqBuffer(buffer) {
        this.dataType = buffer.readUInt8();
        switch (this.dataType) {
            case 0x00: // array
                this.array = [];
                let arrayLen = buffer.readVariableInt();
                for (let i = 0; i < arrayLen; i++) {
                    this.array.push( new HotsTrackerEventStructure(buffer) );
                }
                break;
            case 0x01: // bitarray, weird alignment requirements - haven't seen it used yet so not spending time on it
                /*  bits = self.read_vint()
                    data = self.read_bits(bits) */
                throw new Error("[HotsTrackerEventStructure] Not implemented!")
            case 0x02: // blob
                let blobLen = buffer.readVariableInt();
                this.blob = buffer.readBlob(blobLen);
                break;
            case 0x03: // choice
                this.choiceFlag = buffer.readVariableInt();
                this.choiceData = new HotsTrackerEventStructure(buffer);
                break;
            case 0x04: // optional
                if (buffer.readUInt8() !== 0) {
                    this.optionalData = new HotsTrackerEventStructure(buffer);
                }
                break;
            case 0x05: // struct
                this.dictionary = {};
                let dictLen = buffer.readVariableInt();
                for (let i = 0; i < dictLen; i++) {
                    this.dictionary[ buffer.readVariableInt() ] = new HotsTrackerEventStructure(buffer);
                }
                break;
            case 0x06: // u8
                this.unsignedInt = buffer.readUInt8();
                break;
            case 0x07: // u32
                this.unsignedInt = buffer.readUInt32();
                break;
            case 0x08:
                this.unsignedInt = buffer.readUInt64();
                break;
            case 0x09:
                this.variableInt = buffer.readVariableInt();
                break;
            default:
                throw new Error("[HotsTrackerEventStructure] Unknown data type: "+this.dataType.toString(16));
        }
    }

}

module.exports = HotsTrackerEventStructure;
