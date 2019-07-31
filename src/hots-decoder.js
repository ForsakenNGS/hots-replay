const path = require("path");
const HotsPythonParser = require("./hots-python-parser.js");

const heroprotocolParser = new HotsPythonParser(path.resolve(__dirname, "..", "data", "heroprotocol.py"));
const heroprotocolData = heroprotocolParser.toJson();
const customData = require("../data/custom");

class HotsDecoder {

    static getHeroprotocolTypeInfo(type) {
        if (typeof heroprotocolData.typeinfos[type] !== "undefined") {
            return heroprotocolData.typeinfos[type];
        } else {
            return customData.typeinfos[type];
        }
    }

    static getHeroprotocolValue(name) {
        if (heroprotocolData.hasOwnProperty(name)) {
            return heroprotocolData[name];
        } else {
            return name;
        }
    }

    /**
     * BitPacked Decoder
     * @param {MpqBuffer} buffer
     * @param {number} type
     * @return {*}
     */
    static decode_bitPacked(buffer, type) {
        if (!type.match(/^[0-9]+$/)) {
            // Resolve type string
            type = HotsDecoder.getHeroprotocolValue(type);
        }
        let typeInfo = HotsDecoder.getHeroprotocolTypeInfo(type);
        return HotsDecoder["decode_bitPacked"+typeInfo[0]].call(null, buffer, ...typeInfo[1]);
    }

    static decode_bitPacked_bool(buffer) {
        return HotsDecoder.decode_bitPacked_int(buffer, [0, 1]) != 0;
    }

    static decode_bitPacked_int(buffer, bounds) {
        return parseInt(bounds[0]) + buffer.readBits( parseInt(bounds[1]) );
    }

    static decode_bitPacked_blob(buffer, bounds) {
        let length = HotsDecoder.decode_bitPacked_int(buffer, bounds);
        buffer.alignToByte();
        return buffer.readBlob(length).toString();
    }

    static decode_bitPacked_array(buffer, bounds, typeId) {
        let arrayLen = HotsDecoder.decode_bitPacked_int(buffer, bounds);
        let result = [];
        for (let i = 0; i < arrayLen; i++) {
            result.push( HotsDecoder.decode_bitPacked(buffer, typeId) );
        }
        return result;
    }

    static decode_bitPacked_bitarray(buffer, bounds) {
        let arrayLen = HotsDecoder.decode_bitPacked_int(buffer, bounds);
        let result = [];
        for (let i = 0; i < arrayLen; i++) {
            result.push( buffer.readBits(1) );
        }
        return result;
    }

    static decode_bitPacked_struct(buffer, fields) {
        let result = {};
        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            if (field[0] === "__parent") {
                parent = HotsDecoder.decode_bitPacked(buffer, field[1]);
                if (typeof parent === "object") {
                    Object.assign(result, parent);
                } else if (fields.length === 1) {
                    result = parent;
                } else {
                    result[ field[0] ] = parent;
                }
            } else {
                result[ field[0] ] = HotsDecoder.decode_bitPacked(buffer, field[1]);
            }
        }
        return result;
    }

    static decode_bitPacked_optional(buffer, typeId) {
        let exists = HotsDecoder.decode_bitPacked_bool(buffer);
        return (exists ? HotsDecoder.decode_bitPacked(buffer, typeId) : null);
    }

    static decode_bitPacked_fourcc(buffer) {
        return buffer.readUnalignedBytes(4);
    }

    /**
     * Versioned Decoder
     * @param {MpqBuffer} buffer
     * @param {number} type
     * @return {*}
     */
    static decode_versioned(buffer, type) {
        if (!type.match(/^[0-9]+$/)) {
            // Resolve type string
            type = HotsDecoder.getHeroprotocolValue(type);
        }
        let typeInfo = HotsDecoder.getHeroprotocolTypeInfo(type);
        return HotsDecoder["decode_versioned"+typeInfo[0]].call(null, buffer, ...typeInfo[1]);
    }

    static decode_versioned_expect_skip(buffer, expected) {
        let read = buffer.readBits(8);
        if (read !== expected) {
            throw new Error("[HotsDecoder] Corrupted data! (decode_expect_skip expected "+expected+", got "+read+")");
        }
    }

    static decode_versioned_vint(buffer) {
        let b = buffer.readBits(8);
        let negative = b & 1;
        let result = (b >>> 1) & 0x3F;
        let bits = 6;
        while ((b & 0x80) !== 0) {
            b = buffer.readBits(8);
            result |= (b & 0x7F) << bits;
            bits += 7;
        }
        return (negative ? -result : result);
    }

    static decode_versioned_int(buffer) {
        HotsDecoder.decode_versioned_expect_skip(buffer, 9);
        return HotsDecoder.decode_versioned_vint(buffer);
    }

    static decode_versioned_fourcc(buffer) {
        HotsDecoder.decode_versioned_expect_skip(buffer, 7);
        return buffer.readAlignedBytes(4);
    }

    static decode_versioned_bool(buffer) {
        HotsDecoder.decode_versioned_expect_skip(buffer, 6);
        return (buffer.readBits(8) !== 0);
    }

    static decode_versioned_blob(buffer) {
        HotsDecoder.decode_versioned_expect_skip(buffer, 2);
        let length = HotsDecoder.decode_versioned_vint(buffer);
        return buffer.readBlob(length).toString();
    }

    static decode_versioned_optional(buffer, typeId) {
        HotsDecoder.decode_versioned_expect_skip(buffer, 4);
        let exists = (buffer.readBits(8) !== 0);
        return (exists ? HotsDecoder.decode_versioned(buffer, typeId) : null);
    }

    static decode_versioned_array(buffer, bounds, typeId) {
        HotsDecoder.decode_versioned_expect_skip(buffer, 0);
        let length = HotsDecoder.decode_versioned_vint(buffer);
        let result = [];
        for (let i = 0; i < length; i++) {
            result.push( HotsDecoder.decode_versioned(buffer, typeId) );
        }
        return result;
    }

    static decode_versioned_struct(buffer, fields) {
        HotsDecoder.decode_versioned_expect_skip(buffer, 5);
        let result = {};
        let length = HotsDecoder.decode_versioned_vint(buffer);
        for (let i = 0; i < length; i++) {
            let tag = HotsDecoder.decode_versioned_vint(buffer);
            let field = fields[i];
            if (parseInt(field[2]) === tag) {
                if (field[0] === "__parent") {
                    parent = HotsDecoder.decode_versioned(buffer, field[1]);
                    if (typeof parent === "object") {
                        Object.assign(result, parent);
                    } else if (fields.length === 1) {
                        result = parent;
                    } else {
                        result[ field[0] ] = parent;
                    }
                } else {
                    result[ field[0] ] = HotsDecoder.decode_versioned(buffer, field[1]);
                }
            } else {
                HotsDecoder.decode_versioned_skip_instance(buffer);
            }
        }
        return result;
    }

    static decode_versioned_skip_instance(buffer) {
        let skip = buffer.readBits(8);
        switch (skip) {
            case 0: { // Array
                let length = HotsDecoder.decode_versioned_vint(buffer);
                for (let i = 0; i < length; i++) {
                    HotsDecoder.decode_versioned_skip_instance(buffer);
                }
                break;
            }
            case 1: { // BitBlob
                let length = HotsDecoder.decode_versioned_vint(buffer);
                buffer.readBlob( Math.ceil( (length + 7) / 8) );
                break;
            }
            case 2: { // Blob
                let length = HotsDecoder.decode_versioned_vint(buffer);
                buffer.readBlob(length);
                break;
            }
            case 3: { // Choice
                let tag = HotsDecoder.decode_versioned_vint(buffer);
                HotsDecoder.decode_versioned_skip_instance(buffer);
                break;
            }
            case 4: { // Optional
                let exists = (buffer.readBits(8) !== 0);
                if (exists) {
                    HotsDecoder.decode_versioned_skip_instance(buffer);
                }
                break;
            }
            case 5: { // Struct
                let length = HotsDecoder.decode_versioned_vint(buffer);
                for (let i = 0; i < length; i++) {
                    let tag = HotsDecoder.decode_versioned_vint(buffer);
                    HotsDecoder.decode_versioned_skip_instance(buffer);
                }
                break;
            }
            case 6: { // u8
                buffer.readAlignedBytes(1);
                break;
            }
            case 7: { // u32
                buffer.readAlignedBytes(4);
                break;
            }
            case 8: { // u64
                buffer.readAlignedBytes(8);
                break;
            }
            case 9: { // vint
                HotsDecoder.decode_versioned_vint(buffer);
                break;
            }
        }
    }

}

module.exports = HotsDecoder;
