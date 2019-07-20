const HotsTrackerEventStructure = require('./hots-tracker-event-structure.js');

class HotsReplayHeader {

    /**
     * @param {MpqBuffer} buffer
     */
    constructor(buffer) {
        this.magic = null;
        this.format = null;
        this.dataMaxSize = null;
        this.headerOffset = null;
        this.userHeaderSize = null;
        this.trackerEventStructure = null;
        this.versionMajor = null;
        this.versionMinor = null;
        this.versionPatch = null;
        this.versionBuild = null;
        this.frames = null;
        this.readFromBuffer(buffer);
    }

    /**
     * @param {MpqBuffer} buffer
     */
    readFromBuffer(buffer) {
        this.magic = buffer.readUInt(24);
        this.format = buffer.readUInt8();
        this.dataMaxSize = buffer.readInt32();
        this.headerOffset = buffer.readInt32();
        this.userHeaderSize = buffer.readInt32();
        this.trackerEventStructure = new HotsTrackerEventStructure(buffer);
        this.versionMajor = this.trackerEventStructure.dictionary[1].dictionary[1].variableInt;
        this.versionMinor = this.trackerEventStructure.dictionary[1].dictionary[2].variableInt;
        this.versionPatch = this.trackerEventStructure.dictionary[1].dictionary[3].variableInt;
        this.versionBuild = this.trackerEventStructure.dictionary[1].dictionary[4].variableInt;
        if (this.versionBuild < 51978) {
            this.versionMajor = 1;
        }
        if (this.versionBuild >= 39951) {
            this.versionBuild = this.trackerEventStructure.dictionary[6].variableInt;
        }
        this.frames = this.trackerEventStructure.dictionary[3].variableInt;
    }

}

module.exports = HotsReplayHeader;
