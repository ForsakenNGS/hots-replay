// Local classes
const MpqFile = require('mpq-file').MpqFile;
const MpqBuffer = require('mpq-file').MpqBuffer;
const HotsDecoder = require('./hots-decoder.js');

class HotsReplay extends MpqFile {

    constructor(file) {
        super(file);
        this.bufferMpq = new MpqBuffer(this.buffer, 16);
        this.replayHeader = HotsDecoder.decode_versioned(this.bufferMpq, "replay_header_typeid");
        this.replayDetails = null;
        this.replayDataInit = null;
        this.replayGameEvents = null;
        this.replayMessageEvents = null;
        this.replayTrackerEvents = null;
        this.replayAttributesEvents = null;
    }

    getReplayDetails() {
        if (this.replayDetails === null) {
            this.replayDetails = HotsDecoder.decode_versioned(this.openFile("replay.details").readFile(), "game_details_typeid");
        }
        return this.replayDetails;
    }

    getReplayDataInit() {
        if (this.replayDataInit === null) {
            this.replayDataInit = HotsDecoder.decode_bitPacked(this.openFile("replay.initData").readFile(), "replay_initdata_typeid");
        }
        return this.replayDataInit;
    }

    getReplayGameEvents() {
        if (this.replayGameEvents === null) {
            throw new Error("Not yet implemented!");
            //this.replayGameEvents = HotsDecoder.decode_bitPacked(this.openFile("replay.game.events").readFile(), "replay_initdata_typeid");
        }
        return this.replayGameEvents;
    }

    getReplayMessageEvents() {
        if (this.replayMessageEvents === null) {
            throw new Error("Not yet implemented!");
            //this.replayMessageEvents = HotsDecoder.decode_bitPacked(this.openFile("replay.game.events").readFile(), "replay_initdata_typeid");
        }
        return this.replayMessageEvents;
    }

    getReplayTrackerEvents() {
        if (this.replayTrackerEvents === null) {
            throw new Error("Not yet implemented!");
            //this.replayTrackerEvents = HotsDecoder.decode_bitPacked(this.openFile("replay.game.events").readFile(), "replay_initdata_typeid");
        }
        return this.replayTrackerEvents;
    }

    getReplayAttributesEvents() {
        if (this.replayAttributesEvents === null) {
            throw new Error("Not yet implemented!");
            //this.replayAttributesEvents = HotsDecoder.decode_bitPacked(this.openFile("replay.initData").readFile(), "replay_initdata_typeid");
        }
        return this.replayAttributesEvents;
    }

}

module.exports = HotsReplay;
