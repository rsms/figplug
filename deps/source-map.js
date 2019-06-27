const exports = {}, module = {
    exports
};

(function() {
    var root, factory;
    root = this, factory = function() {
        return function(modules) {
            var installedModules = {};
            function __webpack_require__(moduleId) {
                if (installedModules[moduleId]) return installedModules[moduleId].exports;
                var module = installedModules[moduleId] = {
                    exports: {},
                    id: moduleId,
                    loaded: !1
                };
                return modules[moduleId].call(module.exports, module, module.exports, __webpack_require__), 
                module.loaded = !0, module.exports;
            }
            return __webpack_require__.m = modules, __webpack_require__.c = installedModules, 
            __webpack_require__.p = "", __webpack_require__(0);
        }([ function(module, exports, __webpack_require__) {
            exports.SourceMapGenerator = __webpack_require__(1).SourceMapGenerator, exports.SourceMapConsumer = __webpack_require__(7).SourceMapConsumer, 
            exports.SourceNode = __webpack_require__(10).SourceNode;
        }, function(module, exports, __webpack_require__) {
            var base64VLQ = __webpack_require__(2), util = __webpack_require__(4), ArraySet = __webpack_require__(5).ArraySet, MappingList = __webpack_require__(6).MappingList;
            function SourceMapGenerator(aArgs) {
                aArgs || (aArgs = {}), this._file = util.getArg(aArgs, "file", null), this._sourceRoot = util.getArg(aArgs, "sourceRoot", null), 
                this._skipValidation = util.getArg(aArgs, "skipValidation", !1), this._sources = new ArraySet(), 
                this._names = new ArraySet(), this._mappings = new MappingList(), this._sourcesContents = null;
            }
            SourceMapGenerator.prototype._version = 3, SourceMapGenerator.fromSourceMap = function(aSourceMapConsumer) {
                var sourceRoot = aSourceMapConsumer.sourceRoot, generator = new SourceMapGenerator({
                    file: aSourceMapConsumer.file,
                    sourceRoot
                });
                return aSourceMapConsumer.eachMapping(function(mapping) {
                    var newMapping = {
                        generated: {
                            line: mapping.generatedLine,
                            column: mapping.generatedColumn
                        }
                    };
                    null != mapping.source && (newMapping.source = mapping.source, null != sourceRoot && (newMapping.source = util.relative(sourceRoot, newMapping.source)), 
                    newMapping.original = {
                        line: mapping.originalLine,
                        column: mapping.originalColumn
                    }, null != mapping.name && (newMapping.name = mapping.name)), generator.addMapping(newMapping);
                }), aSourceMapConsumer.sources.forEach(function(sourceFile) {
                    var sourceRelative = sourceFile;
                    null !== sourceRoot && (sourceRelative = util.relative(sourceRoot, sourceFile)), 
                    generator._sources.has(sourceRelative) || generator._sources.add(sourceRelative);
                    var content = aSourceMapConsumer.sourceContentFor(sourceFile);
                    null != content && generator.setSourceContent(sourceFile, content);
                }), generator;
            }, SourceMapGenerator.prototype.addMapping = function(aArgs) {
                var generated = util.getArg(aArgs, "generated"), original = util.getArg(aArgs, "original", null), source = util.getArg(aArgs, "source", null), name = util.getArg(aArgs, "name", null);
                this._skipValidation || this._validateMapping(generated, original, source, name), 
                null != source && (source = String(source), this._sources.has(source) || this._sources.add(source)), 
                null != name && (name = String(name), this._names.has(name) || this._names.add(name)), 
                this._mappings.add({
                    generatedLine: generated.line,
                    generatedColumn: generated.column,
                    originalLine: null != original && original.line,
                    originalColumn: null != original && original.column,
                    source,
                    name
                });
            }, SourceMapGenerator.prototype.setSourceContent = function(aSourceFile, aSourceContent) {
                var source = aSourceFile;
                null != this._sourceRoot && (source = util.relative(this._sourceRoot, source)), 
                null != aSourceContent ? (this._sourcesContents || (this._sourcesContents = Object.create(null)), 
                this._sourcesContents[util.toSetString(source)] = aSourceContent) : this._sourcesContents && (delete this._sourcesContents[util.toSetString(source)], 
                0 === Object.keys(this._sourcesContents).length && (this._sourcesContents = null));
            }, SourceMapGenerator.prototype.applySourceMap = function(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
                var sourceFile = aSourceFile;
                if (null == aSourceFile) {
                    if (null == aSourceMapConsumer.file) throw new Error('SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map\'s "file" property. Both were omitted.');
                    sourceFile = aSourceMapConsumer.file;
                }
                var sourceRoot = this._sourceRoot;
                null != sourceRoot && (sourceFile = util.relative(sourceRoot, sourceFile));
                var newSources = new ArraySet(), newNames = new ArraySet();
                this._mappings.unsortedForEach(function(mapping) {
                    if (mapping.source === sourceFile && null != mapping.originalLine) {
                        var original = aSourceMapConsumer.originalPositionFor({
                            line: mapping.originalLine,
                            column: mapping.originalColumn
                        });
                        null != original.source && (mapping.source = original.source, null != aSourceMapPath && (mapping.source = util.join(aSourceMapPath, mapping.source)), 
                        null != sourceRoot && (mapping.source = util.relative(sourceRoot, mapping.source)), 
                        mapping.originalLine = original.line, mapping.originalColumn = original.column, 
                        null != original.name && (mapping.name = original.name));
                    }
                    var source = mapping.source;
                    null == source || newSources.has(source) || newSources.add(source);
                    var name = mapping.name;
                    null == name || newNames.has(name) || newNames.add(name);
                }, this), this._sources = newSources, this._names = newNames, aSourceMapConsumer.sources.forEach(function(sourceFile) {
                    var content = aSourceMapConsumer.sourceContentFor(sourceFile);
                    null != content && (null != aSourceMapPath && (sourceFile = util.join(aSourceMapPath, sourceFile)), 
                    null != sourceRoot && (sourceFile = util.relative(sourceRoot, sourceFile)), this.setSourceContent(sourceFile, content));
                }, this);
            }, SourceMapGenerator.prototype._validateMapping = function(aGenerated, aOriginal, aSource, aName) {
                if (aOriginal && "number" != typeof aOriginal.line && "number" != typeof aOriginal.column) throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");
                if ((!(aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0) || aOriginal || aSource || aName) && !(aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource)) throw new Error("Invalid mapping: " + JSON.stringify({
                    generated: aGenerated,
                    source: aSource,
                    original: aOriginal,
                    name: aName
                }));
            }, SourceMapGenerator.prototype._serializeMappings = function() {
                for (var next, mapping, nameIdx, sourceIdx, previousGeneratedColumn = 0, previousGeneratedLine = 1, previousOriginalColumn = 0, previousOriginalLine = 0, previousName = 0, previousSource = 0, result = "", mappings = this._mappings.toArray(), i = 0, len = mappings.length; i < len; i++) {
                    if (next = "", (mapping = mappings[i]).generatedLine !== previousGeneratedLine) for (previousGeneratedColumn = 0; mapping.generatedLine !== previousGeneratedLine; ) next += ";", 
                    previousGeneratedLine++; else if (i > 0) {
                        if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) continue;
                        next += ",";
                    }
                    next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn), previousGeneratedColumn = mapping.generatedColumn, 
                    null != mapping.source && (sourceIdx = this._sources.indexOf(mapping.source), next += base64VLQ.encode(sourceIdx - previousSource), 
                    previousSource = sourceIdx, next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine), 
                    previousOriginalLine = mapping.originalLine - 1, next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn), 
                    previousOriginalColumn = mapping.originalColumn, null != mapping.name && (nameIdx = this._names.indexOf(mapping.name), 
                    next += base64VLQ.encode(nameIdx - previousName), previousName = nameIdx)), result += next;
                }
                return result;
            }, SourceMapGenerator.prototype._generateSourcesContent = function(aSources, aSourceRoot) {
                return aSources.map(function(source) {
                    if (!this._sourcesContents) return null;
                    null != aSourceRoot && (source = util.relative(aSourceRoot, source));
                    var key = util.toSetString(source);
                    return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
                }, this);
            }, SourceMapGenerator.prototype.toJSON = function() {
                var map = {
                    version: this._version,
                    sources: this._sources.toArray(),
                    names: this._names.toArray(),
                    mappings: this._serializeMappings()
                };
                return null != this._file && (map.file = this._file), null != this._sourceRoot && (map.sourceRoot = this._sourceRoot), 
                this._sourcesContents && (map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot)), 
                map;
            }, SourceMapGenerator.prototype.toString = function() {
                return JSON.stringify(this.toJSON());
            }, exports.SourceMapGenerator = SourceMapGenerator;
        }, function(module, exports, __webpack_require__) {
            var base64 = __webpack_require__(3);
            exports.encode = function(aValue) {
                var digit, encoded = "", vlq = function(aValue) {
                    return aValue < 0 ? 1 + (-aValue << 1) : 0 + (aValue << 1);
                }(aValue);
                do {
                    digit = 31 & vlq, (vlq >>>= 5) > 0 && (digit |= 32), encoded += base64.encode(digit);
                } while (vlq > 0);
                return encoded;
            }, exports.decode = function(aStr, aIndex, aOutParam) {
                var continuation, digit, aValue, shifted, strLen = aStr.length, result = 0, shift = 0;
                do {
                    if (aIndex >= strLen) throw new Error("Expected more digits in base 64 VLQ value.");
                    if (-1 === (digit = base64.decode(aStr.charCodeAt(aIndex++)))) throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
                    continuation = !!(32 & digit), result += (digit &= 31) << shift, shift += 5;
                } while (continuation);
                aOutParam.value = (shifted = (aValue = result) >> 1, 1 == (1 & aValue) ? -shifted : shifted), 
                aOutParam.rest = aIndex;
            };
        }, function(module, exports) {
            var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
            exports.encode = function(number) {
                if (0 <= number && number < intToCharMap.length) return intToCharMap[number];
                throw new TypeError("Must be between 0 and 63: " + number);
            }, exports.decode = function(charCode) {
                return 65 <= charCode && charCode <= 90 ? charCode - 65 : 97 <= charCode && charCode <= 122 ? charCode - 97 + 26 : 48 <= charCode && charCode <= 57 ? charCode - 48 + 52 : 43 == charCode ? 62 : 47 == charCode ? 63 : -1;
            };
        }, function(module, exports) {
            exports.getArg = function(aArgs, aName, aDefaultValue) {
                if (aName in aArgs) return aArgs[aName];
                if (3 === arguments.length) return aDefaultValue;
                throw new Error('"' + aName + '" is a required argument.');
            };
            var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/, dataUrlRegexp = /^data:.+\,.+$/;
            function urlParse(aUrl) {
                var match = aUrl.match(urlRegexp);
                return match ? {
                    scheme: match[1],
                    auth: match[2],
                    host: match[3],
                    port: match[4],
                    path: match[5]
                } : null;
            }
            function urlGenerate(aParsedUrl) {
                var url = "";
                return aParsedUrl.scheme && (url += aParsedUrl.scheme + ":"), url += "//", aParsedUrl.auth && (url += aParsedUrl.auth + "@"), 
                aParsedUrl.host && (url += aParsedUrl.host), aParsedUrl.port && (url += ":" + aParsedUrl.port), 
                aParsedUrl.path && (url += aParsedUrl.path), url;
            }
            function normalize(aPath) {
                var path = aPath, url = urlParse(aPath);
                if (url) {
                    if (!url.path) return aPath;
                    path = url.path;
                }
                for (var part, isAbsolute = exports.isAbsolute(path), parts = path.split(/\/+/), up = 0, i = parts.length - 1; i >= 0; i--) "." === (part = parts[i]) ? parts.splice(i, 1) : ".." === part ? up++ : up > 0 && ("" === part ? (parts.splice(i + 1, up), 
                up = 0) : (parts.splice(i, 2), up--));
                return "" === (path = parts.join("/")) && (path = isAbsolute ? "/" : "."), url ? (url.path = path, 
                urlGenerate(url)) : path;
            }
            function join(aRoot, aPath) {
                "" === aRoot && (aRoot = "."), "" === aPath && (aPath = ".");
                var aPathUrl = urlParse(aPath), aRootUrl = urlParse(aRoot);
                if (aRootUrl && (aRoot = aRootUrl.path || "/"), aPathUrl && !aPathUrl.scheme) return aRootUrl && (aPathUrl.scheme = aRootUrl.scheme), 
                urlGenerate(aPathUrl);
                if (aPathUrl || aPath.match(dataUrlRegexp)) return aPath;
                if (aRootUrl && !aRootUrl.host && !aRootUrl.path) return aRootUrl.host = aPath, 
                urlGenerate(aRootUrl);
                var joined = "/" === aPath.charAt(0) ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
                return aRootUrl ? (aRootUrl.path = joined, urlGenerate(aRootUrl)) : joined;
            }
            exports.urlParse = urlParse, exports.urlGenerate = urlGenerate, exports.normalize = normalize, 
            exports.join = join, exports.isAbsolute = function(aPath) {
                return "/" === aPath.charAt(0) || urlRegexp.test(aPath);
            }, exports.relative = function(aRoot, aPath) {
                "" === aRoot && (aRoot = "."), aRoot = aRoot.replace(/\/$/, "");
                for (var level = 0; 0 !== aPath.indexOf(aRoot + "/"); ) {
                    var index = aRoot.lastIndexOf("/");
                    if (index < 0) return aPath;
                    if ((aRoot = aRoot.slice(0, index)).match(/^([^\/]+:\/)?\/*$/)) return aPath;
                    ++level;
                }
                return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
            };
            var supportsNullProto = !("__proto__" in Object.create(null));
            function identity(s) {
                return s;
            }
            function isProtoString(s) {
                if (!s) return !1;
                var length = s.length;
                if (length < 9) return !1;
                if (95 !== s.charCodeAt(length - 1) || 95 !== s.charCodeAt(length - 2) || 111 !== s.charCodeAt(length - 3) || 116 !== s.charCodeAt(length - 4) || 111 !== s.charCodeAt(length - 5) || 114 !== s.charCodeAt(length - 6) || 112 !== s.charCodeAt(length - 7) || 95 !== s.charCodeAt(length - 8) || 95 !== s.charCodeAt(length - 9)) return !1;
                for (var i = length - 10; i >= 0; i--) if (36 !== s.charCodeAt(i)) return !1;
                return !0;
            }
            function strcmp(aStr1, aStr2) {
                return aStr1 === aStr2 ? 0 : null === aStr1 ? 1 : null === aStr2 ? -1 : aStr1 > aStr2 ? 1 : -1;
            }
            exports.toSetString = supportsNullProto ? identity : function(aStr) {
                return isProtoString(aStr) ? "$" + aStr : aStr;
            }, exports.fromSetString = supportsNullProto ? identity : function(aStr) {
                return isProtoString(aStr) ? aStr.slice(1) : aStr;
            }, exports.compareByOriginalPositions = function(mappingA, mappingB, onlyCompareOriginal) {
                var cmp = strcmp(mappingA.source, mappingB.source);
                return 0 !== cmp ? cmp : 0 != (cmp = mappingA.originalLine - mappingB.originalLine) ? cmp : 0 != (cmp = mappingA.originalColumn - mappingB.originalColumn) || onlyCompareOriginal ? cmp : 0 != (cmp = mappingA.generatedColumn - mappingB.generatedColumn) ? cmp : 0 != (cmp = mappingA.generatedLine - mappingB.generatedLine) ? cmp : strcmp(mappingA.name, mappingB.name);
            }, exports.compareByGeneratedPositionsDeflated = function(mappingA, mappingB, onlyCompareGenerated) {
                var cmp = mappingA.generatedLine - mappingB.generatedLine;
                return 0 !== cmp ? cmp : 0 != (cmp = mappingA.generatedColumn - mappingB.generatedColumn) || onlyCompareGenerated ? cmp : 0 !== (cmp = strcmp(mappingA.source, mappingB.source)) ? cmp : 0 != (cmp = mappingA.originalLine - mappingB.originalLine) ? cmp : 0 != (cmp = mappingA.originalColumn - mappingB.originalColumn) ? cmp : strcmp(mappingA.name, mappingB.name);
            }, exports.compareByGeneratedPositionsInflated = function(mappingA, mappingB) {
                var cmp = mappingA.generatedLine - mappingB.generatedLine;
                return 0 !== cmp ? cmp : 0 != (cmp = mappingA.generatedColumn - mappingB.generatedColumn) ? cmp : 0 !== (cmp = strcmp(mappingA.source, mappingB.source)) ? cmp : 0 != (cmp = mappingA.originalLine - mappingB.originalLine) ? cmp : 0 != (cmp = mappingA.originalColumn - mappingB.originalColumn) ? cmp : strcmp(mappingA.name, mappingB.name);
            }, exports.parseSourceMapInput = function(str) {
                return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
            }, exports.computeSourceURL = function(sourceRoot, sourceURL, sourceMapURL) {
                if (sourceURL = sourceURL || "", sourceRoot && ("/" !== sourceRoot[sourceRoot.length - 1] && "/" !== sourceURL[0] && (sourceRoot += "/"), 
                sourceURL = sourceRoot + sourceURL), sourceMapURL) {
                    var parsed = urlParse(sourceMapURL);
                    if (!parsed) throw new Error("sourceMapURL could not be parsed");
                    if (parsed.path) {
                        var index = parsed.path.lastIndexOf("/");
                        index >= 0 && (parsed.path = parsed.path.substring(0, index + 1));
                    }
                    sourceURL = join(urlGenerate(parsed), sourceURL);
                }
                return normalize(sourceURL);
            };
        }, function(module, exports, __webpack_require__) {
            var util = __webpack_require__(4), has = Object.prototype.hasOwnProperty, hasNativeMap = "undefined" != typeof Map;
            function ArraySet() {
                this._array = [], this._set = hasNativeMap ? new Map() : Object.create(null);
            }
            ArraySet.fromArray = function(aArray, aAllowDuplicates) {
                for (var set = new ArraySet(), i = 0, len = aArray.length; i < len; i++) set.add(aArray[i], aAllowDuplicates);
                return set;
            }, ArraySet.prototype.size = function() {
                return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
            }, ArraySet.prototype.add = function(aStr, aAllowDuplicates) {
                var sStr = hasNativeMap ? aStr : util.toSetString(aStr), isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr), idx = this._array.length;
                isDuplicate && !aAllowDuplicates || this._array.push(aStr), isDuplicate || (hasNativeMap ? this._set.set(aStr, idx) : this._set[sStr] = idx);
            }, ArraySet.prototype.has = function(aStr) {
                if (hasNativeMap) return this._set.has(aStr);
                var sStr = util.toSetString(aStr);
                return has.call(this._set, sStr);
            }, ArraySet.prototype.indexOf = function(aStr) {
                if (hasNativeMap) {
                    var idx = this._set.get(aStr);
                    if (idx >= 0) return idx;
                } else {
                    var sStr = util.toSetString(aStr);
                    if (has.call(this._set, sStr)) return this._set[sStr];
                }
                throw new Error('"' + aStr + '" is not in the set.');
            }, ArraySet.prototype.at = function(aIdx) {
                if (aIdx >= 0 && aIdx < this._array.length) return this._array[aIdx];
                throw new Error("No element indexed by " + aIdx);
            }, ArraySet.prototype.toArray = function() {
                return this._array.slice();
            }, exports.ArraySet = ArraySet;
        }, function(module, exports, __webpack_require__) {
            var util = __webpack_require__(4);
            function MappingList() {
                this._array = [], this._sorted = !0, this._last = {
                    generatedLine: -1,
                    generatedColumn: 0
                };
            }
            MappingList.prototype.unsortedForEach = function(aCallback, aThisArg) {
                this._array.forEach(aCallback, aThisArg);
            }, MappingList.prototype.add = function(aMapping) {
                var mappingA, mappingB, lineA, lineB, columnA, columnB;
                mappingA = this._last, mappingB = aMapping, lineA = mappingA.generatedLine, lineB = mappingB.generatedLine, 
                columnA = mappingA.generatedColumn, columnB = mappingB.generatedColumn, lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0 ? (this._last = aMapping, 
                this._array.push(aMapping)) : (this._sorted = !1, this._array.push(aMapping));
            }, MappingList.prototype.toArray = function() {
                return this._sorted || (this._array.sort(util.compareByGeneratedPositionsInflated), 
                this._sorted = !0), this._array;
            }, exports.MappingList = MappingList;
        }, function(module, exports, __webpack_require__) {
            var util = __webpack_require__(4), binarySearch = __webpack_require__(8), ArraySet = __webpack_require__(5).ArraySet, base64VLQ = __webpack_require__(2), quickSort = __webpack_require__(9).quickSort;
            function SourceMapConsumer(aSourceMap, aSourceMapURL) {
                var sourceMap = aSourceMap;
                return "string" == typeof aSourceMap && (sourceMap = util.parseSourceMapInput(aSourceMap)), 
                null != sourceMap.sections ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
            }
            function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
                var sourceMap = aSourceMap;
                "string" == typeof aSourceMap && (sourceMap = util.parseSourceMapInput(aSourceMap));
                var version = util.getArg(sourceMap, "version"), sources = util.getArg(sourceMap, "sources"), names = util.getArg(sourceMap, "names", []), sourceRoot = util.getArg(sourceMap, "sourceRoot", null), sourcesContent = util.getArg(sourceMap, "sourcesContent", null), mappings = util.getArg(sourceMap, "mappings"), file = util.getArg(sourceMap, "file", null);
                if (version != this._version) throw new Error("Unsupported version: " + version);
                sourceRoot && (sourceRoot = util.normalize(sourceRoot)), sources = sources.map(String).map(util.normalize).map(function(source) {
                    return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ? util.relative(sourceRoot, source) : source;
                }), this._names = ArraySet.fromArray(names.map(String), !0), this._sources = ArraySet.fromArray(sources, !0), 
                this._absoluteSources = this._sources.toArray().map(function(s) {
                    return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
                }), this.sourceRoot = sourceRoot, this.sourcesContent = sourcesContent, this._mappings = mappings, 
                this._sourceMapURL = aSourceMapURL, this.file = file;
            }
            function Mapping() {
                this.generatedLine = 0, this.generatedColumn = 0, this.source = null, this.originalLine = null, 
                this.originalColumn = null, this.name = null;
            }
            function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
                var sourceMap = aSourceMap;
                "string" == typeof aSourceMap && (sourceMap = util.parseSourceMapInput(aSourceMap));
                var version = util.getArg(sourceMap, "version"), sections = util.getArg(sourceMap, "sections");
                if (version != this._version) throw new Error("Unsupported version: " + version);
                this._sources = new ArraySet(), this._names = new ArraySet();
                var lastOffset = {
                    line: -1,
                    column: 0
                };
                this._sections = sections.map(function(s) {
                    if (s.url) throw new Error("Support for url field in sections not implemented.");
                    var offset = util.getArg(s, "offset"), offsetLine = util.getArg(offset, "line"), offsetColumn = util.getArg(offset, "column");
                    if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) throw new Error("Section offsets must be ordered and non-overlapping.");
                    return lastOffset = offset, {
                        generatedOffset: {
                            generatedLine: offsetLine + 1,
                            generatedColumn: offsetColumn + 1
                        },
                        consumer: new SourceMapConsumer(util.getArg(s, "map"), aSourceMapURL)
                    };
                });
            }
            SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
                return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
            }, SourceMapConsumer.prototype._version = 3, SourceMapConsumer.prototype.__generatedMappings = null, 
            Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
                configurable: !0,
                enumerable: !0,
                get: function() {
                    return this.__generatedMappings || this._parseMappings(this._mappings, this.sourceRoot), 
                    this.__generatedMappings;
                }
            }), SourceMapConsumer.prototype.__originalMappings = null, Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
                configurable: !0,
                enumerable: !0,
                get: function() {
                    return this.__originalMappings || this._parseMappings(this._mappings, this.sourceRoot), 
                    this.__originalMappings;
                }
            }), SourceMapConsumer.prototype._charIsMappingSeparator = function(aStr, index) {
                var c = aStr.charAt(index);
                return ";" === c || "," === c;
            }, SourceMapConsumer.prototype._parseMappings = function(aStr, aSourceRoot) {
                throw new Error("Subclasses must implement _parseMappings");
            }, SourceMapConsumer.GENERATED_ORDER = 1, SourceMapConsumer.ORIGINAL_ORDER = 2, 
            SourceMapConsumer.GREATEST_LOWER_BOUND = 1, SourceMapConsumer.LEAST_UPPER_BOUND = 2, 
            SourceMapConsumer.prototype.eachMapping = function(aCallback, aContext, aOrder) {
                var mappings, context = aContext || null;
                switch (aOrder || SourceMapConsumer.GENERATED_ORDER) {
                  case SourceMapConsumer.GENERATED_ORDER:
                    mappings = this._generatedMappings;
                    break;

                  case SourceMapConsumer.ORIGINAL_ORDER:
                    mappings = this._originalMappings;
                    break;

                  default:
                    throw new Error("Unknown order of iteration.");
                }
                var sourceRoot = this.sourceRoot;
                mappings.map(function(mapping) {
                    var source = null === mapping.source ? null : this._sources.at(mapping.source);
                    return {
                        source: source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL),
                        generatedLine: mapping.generatedLine,
                        generatedColumn: mapping.generatedColumn,
                        originalLine: mapping.originalLine,
                        originalColumn: mapping.originalColumn,
                        name: null === mapping.name ? null : this._names.at(mapping.name)
                    };
                }, this).forEach(aCallback, context);
            }, SourceMapConsumer.prototype.allGeneratedPositionsFor = function(aArgs) {
                var line = util.getArg(aArgs, "line"), needle = {
                    source: util.getArg(aArgs, "source"),
                    originalLine: line,
                    originalColumn: util.getArg(aArgs, "column", 0)
                };
                if (needle.source = this._findSourceIndex(needle.source), needle.source < 0) return [];
                var mappings = [], index = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util.compareByOriginalPositions, binarySearch.LEAST_UPPER_BOUND);
                if (index >= 0) {
                    var mapping = this._originalMappings[index];
                    if (void 0 === aArgs.column) for (var originalLine = mapping.originalLine; mapping && mapping.originalLine === originalLine; ) mappings.push({
                        line: util.getArg(mapping, "generatedLine", null),
                        column: util.getArg(mapping, "generatedColumn", null),
                        lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
                    }), mapping = this._originalMappings[++index]; else for (var originalColumn = mapping.originalColumn; mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn; ) mappings.push({
                        line: util.getArg(mapping, "generatedLine", null),
                        column: util.getArg(mapping, "generatedColumn", null),
                        lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
                    }), mapping = this._originalMappings[++index];
                }
                return mappings;
            }, exports.SourceMapConsumer = SourceMapConsumer, BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype), 
            BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer, BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
                var i, relativeSource = aSource;
                if (null != this.sourceRoot && (relativeSource = util.relative(this.sourceRoot, relativeSource)), 
                this._sources.has(relativeSource)) return this._sources.indexOf(relativeSource);
                for (i = 0; i < this._absoluteSources.length; ++i) if (this._absoluteSources[i] == aSource) return i;
                return -1;
            }, BasicSourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
                var smc = Object.create(BasicSourceMapConsumer.prototype), names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), !0), sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), !0);
                smc.sourceRoot = aSourceMap._sourceRoot, smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(), smc.sourceRoot), 
                smc.file = aSourceMap._file, smc._sourceMapURL = aSourceMapURL, smc._absoluteSources = smc._sources.toArray().map(function(s) {
                    return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
                });
                for (var generatedMappings = aSourceMap._mappings.toArray().slice(), destGeneratedMappings = smc.__generatedMappings = [], destOriginalMappings = smc.__originalMappings = [], i = 0, length = generatedMappings.length; i < length; i++) {
                    var srcMapping = generatedMappings[i], destMapping = new Mapping();
                    destMapping.generatedLine = srcMapping.generatedLine, destMapping.generatedColumn = srcMapping.generatedColumn, 
                    srcMapping.source && (destMapping.source = sources.indexOf(srcMapping.source), destMapping.originalLine = srcMapping.originalLine, 
                    destMapping.originalColumn = srcMapping.originalColumn, srcMapping.name && (destMapping.name = names.indexOf(srcMapping.name)), 
                    destOriginalMappings.push(destMapping)), destGeneratedMappings.push(destMapping);
                }
                return quickSort(smc.__originalMappings, util.compareByOriginalPositions), smc;
            }, BasicSourceMapConsumer.prototype._version = 3, Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
                get: function() {
                    return this._absoluteSources.slice();
                }
            }), BasicSourceMapConsumer.prototype._parseMappings = function(aStr, aSourceRoot) {
                for (var mapping, str, segment, end, value, generatedLine = 1, previousGeneratedColumn = 0, previousOriginalLine = 0, previousOriginalColumn = 0, previousSource = 0, previousName = 0, length = aStr.length, index = 0, cachedSegments = {}, temp = {}, originalMappings = [], generatedMappings = []; index < length; ) if (";" === aStr.charAt(index)) generatedLine++, 
                index++, previousGeneratedColumn = 0; else if ("," === aStr.charAt(index)) index++; else {
                    for ((mapping = new Mapping()).generatedLine = generatedLine, end = index; end < length && !this._charIsMappingSeparator(aStr, end); end++) ;
                    if (segment = cachedSegments[str = aStr.slice(index, end)]) index += str.length; else {
                        for (segment = []; index < end; ) base64VLQ.decode(aStr, index, temp), value = temp.value, 
                        index = temp.rest, segment.push(value);
                        if (2 === segment.length) throw new Error("Found a source, but no line and column");
                        if (3 === segment.length) throw new Error("Found a source and line, but no column");
                        cachedSegments[str] = segment;
                    }
                    mapping.generatedColumn = previousGeneratedColumn + segment[0], previousGeneratedColumn = mapping.generatedColumn, 
                    segment.length > 1 && (mapping.source = previousSource + segment[1], previousSource += segment[1], 
                    mapping.originalLine = previousOriginalLine + segment[2], previousOriginalLine = mapping.originalLine, 
                    mapping.originalLine += 1, mapping.originalColumn = previousOriginalColumn + segment[3], 
                    previousOriginalColumn = mapping.originalColumn, segment.length > 4 && (mapping.name = previousName + segment[4], 
                    previousName += segment[4])), generatedMappings.push(mapping), "number" == typeof mapping.originalLine && originalMappings.push(mapping);
                }
                quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated), this.__generatedMappings = generatedMappings, 
                quickSort(originalMappings, util.compareByOriginalPositions), this.__originalMappings = originalMappings;
            }, BasicSourceMapConsumer.prototype._findMapping = function(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
                if (aNeedle[aLineName] <= 0) throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
                if (aNeedle[aColumnName] < 0) throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
                return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
            }, BasicSourceMapConsumer.prototype.computeColumnSpans = function() {
                for (var index = 0; index < this._generatedMappings.length; ++index) {
                    var mapping = this._generatedMappings[index];
                    if (index + 1 < this._generatedMappings.length) {
                        var nextMapping = this._generatedMappings[index + 1];
                        if (mapping.generatedLine === nextMapping.generatedLine) {
                            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
                            continue;
                        }
                    }
                    mapping.lastGeneratedColumn = 1 / 0;
                }
            }, BasicSourceMapConsumer.prototype.originalPositionFor = function(aArgs) {
                var needle = {
                    generatedLine: util.getArg(aArgs, "line"),
                    generatedColumn: util.getArg(aArgs, "column")
                }, index = this._findMapping(needle, this._generatedMappings, "generatedLine", "generatedColumn", util.compareByGeneratedPositionsDeflated, util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND));
                if (index >= 0) {
                    var mapping = this._generatedMappings[index];
                    if (mapping.generatedLine === needle.generatedLine) {
                        var source = util.getArg(mapping, "source", null);
                        null !== source && (source = this._sources.at(source), source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL));
                        var name = util.getArg(mapping, "name", null);
                        return null !== name && (name = this._names.at(name)), {
                            source,
                            line: util.getArg(mapping, "originalLine", null),
                            column: util.getArg(mapping, "originalColumn", null),
                            name
                        };
                    }
                }
                return {
                    source: null,
                    line: null,
                    column: null,
                    name: null
                };
            }, BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function() {
                return !!this.sourcesContent && (this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
                    return null == sc;
                }));
            }, BasicSourceMapConsumer.prototype.sourceContentFor = function(aSource, nullOnMissing) {
                if (!this.sourcesContent) return null;
                var index = this._findSourceIndex(aSource);
                if (index >= 0) return this.sourcesContent[index];
                var url, relativeSource = aSource;
                if (null != this.sourceRoot && (relativeSource = util.relative(this.sourceRoot, relativeSource)), 
                null != this.sourceRoot && (url = util.urlParse(this.sourceRoot))) {
                    var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
                    if ("file" == url.scheme && this._sources.has(fileUriAbsPath)) return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
                    if ((!url.path || "/" == url.path) && this._sources.has("/" + relativeSource)) return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
                }
                if (nullOnMissing) return null;
                throw new Error('"' + relativeSource + '" is not in the SourceMap.');
            }, BasicSourceMapConsumer.prototype.generatedPositionFor = function(aArgs) {
                var source = util.getArg(aArgs, "source");
                if ((source = this._findSourceIndex(source)) < 0) return {
                    line: null,
                    column: null,
                    lastColumn: null
                };
                var needle = {
                    source,
                    originalLine: util.getArg(aArgs, "line"),
                    originalColumn: util.getArg(aArgs, "column")
                }, index = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util.compareByOriginalPositions, util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND));
                if (index >= 0) {
                    var mapping = this._originalMappings[index];
                    if (mapping.source === needle.source) return {
                        line: util.getArg(mapping, "generatedLine", null),
                        column: util.getArg(mapping, "generatedColumn", null),
                        lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
                    };
                }
                return {
                    line: null,
                    column: null,
                    lastColumn: null
                };
            }, exports.BasicSourceMapConsumer = BasicSourceMapConsumer, IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype), 
            IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer, IndexedSourceMapConsumer.prototype._version = 3, 
            Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
                get: function() {
                    for (var sources = [], i = 0; i < this._sections.length; i++) for (var j = 0; j < this._sections[i].consumer.sources.length; j++) sources.push(this._sections[i].consumer.sources[j]);
                    return sources;
                }
            }), IndexedSourceMapConsumer.prototype.originalPositionFor = function(aArgs) {
                var needle = {
                    generatedLine: util.getArg(aArgs, "line"),
                    generatedColumn: util.getArg(aArgs, "column")
                }, sectionIndex = binarySearch.search(needle, this._sections, function(needle, section) {
                    var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
                    return cmp || needle.generatedColumn - section.generatedOffset.generatedColumn;
                }), section = this._sections[sectionIndex];
                return section ? section.consumer.originalPositionFor({
                    line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
                    column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
                    bias: aArgs.bias
                }) : {
                    source: null,
                    line: null,
                    column: null,
                    name: null
                };
            }, IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function() {
                return this._sections.every(function(s) {
                    return s.consumer.hasContentsOfAllSources();
                });
            }, IndexedSourceMapConsumer.prototype.sourceContentFor = function(aSource, nullOnMissing) {
                for (var i = 0; i < this._sections.length; i++) {
                    var content = this._sections[i].consumer.sourceContentFor(aSource, !0);
                    if (content) return content;
                }
                if (nullOnMissing) return null;
                throw new Error('"' + aSource + '" is not in the SourceMap.');
            }, IndexedSourceMapConsumer.prototype.generatedPositionFor = function(aArgs) {
                for (var i = 0; i < this._sections.length; i++) {
                    var section = this._sections[i];
                    if (-1 !== section.consumer._findSourceIndex(util.getArg(aArgs, "source"))) {
                        var generatedPosition = section.consumer.generatedPositionFor(aArgs);
                        if (generatedPosition) return {
                            line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
                            column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
                        };
                    }
                }
                return {
                    line: null,
                    column: null
                };
            }, IndexedSourceMapConsumer.prototype._parseMappings = function(aStr, aSourceRoot) {
                this.__generatedMappings = [], this.__originalMappings = [];
                for (var i = 0; i < this._sections.length; i++) for (var section = this._sections[i], sectionMappings = section.consumer._generatedMappings, j = 0; j < sectionMappings.length; j++) {
                    var mapping = sectionMappings[j], source = section.consumer._sources.at(mapping.source);
                    source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL), 
                    this._sources.add(source), source = this._sources.indexOf(source);
                    var name = null;
                    mapping.name && (name = section.consumer._names.at(mapping.name), this._names.add(name), 
                    name = this._names.indexOf(name));
                    var adjustedMapping = {
                        source,
                        generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
                        generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
                        originalLine: mapping.originalLine,
                        originalColumn: mapping.originalColumn,
                        name
                    };
                    this.__generatedMappings.push(adjustedMapping), "number" == typeof adjustedMapping.originalLine && this.__originalMappings.push(adjustedMapping);
                }
                quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated), quickSort(this.__originalMappings, util.compareByOriginalPositions);
            }, exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
        }, function(module, exports) {
            exports.GREATEST_LOWER_BOUND = 1, exports.LEAST_UPPER_BOUND = 2, exports.search = function(aNeedle, aHaystack, aCompare, aBias) {
                if (0 === aHaystack.length) return -1;
                var index = function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
                    var mid = Math.floor((aHigh - aLow) / 2) + aLow, cmp = aCompare(aNeedle, aHaystack[mid], !0);
                    return 0 === cmp ? mid : cmp > 0 ? aHigh - mid > 1 ? recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias) : aBias == exports.LEAST_UPPER_BOUND ? aHigh < aHaystack.length ? aHigh : -1 : mid : mid - aLow > 1 ? recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias) : aBias == exports.LEAST_UPPER_BOUND ? mid : aLow < 0 ? -1 : aLow;
                }(-1, aHaystack.length, aNeedle, aHaystack, aCompare, aBias || exports.GREATEST_LOWER_BOUND);
                if (index < 0) return -1;
                for (;index - 1 >= 0 && 0 === aCompare(aHaystack[index], aHaystack[index - 1], !0); ) --index;
                return index;
            };
        }, function(module, exports) {
            function swap(ary, x, y) {
                var temp = ary[x];
                ary[x] = ary[y], ary[y] = temp;
            }
            function doQuickSort(ary, comparator, p, r) {
                if (p < r) {
                    var i = p - 1;
                    swap(ary, (low = p, high = r, Math.round(low + Math.random() * (high - low))), r);
                    for (var pivot = ary[r], j = p; j < r; j++) comparator(ary[j], pivot) <= 0 && swap(ary, i += 1, j);
                    swap(ary, i + 1, j);
                    var q = i + 1;
                    doQuickSort(ary, comparator, p, q - 1), doQuickSort(ary, comparator, q + 1, r);
                }
                var low, high;
            }
            exports.quickSort = function(ary, comparator) {
                doQuickSort(ary, comparator, 0, ary.length - 1);
            };
        }, function(module, exports, __webpack_require__) {
            var SourceMapGenerator = __webpack_require__(1).SourceMapGenerator, util = __webpack_require__(4), REGEX_NEWLINE = /(\r?\n)/, isSourceNode = "$$$isSourceNode$$$";
            function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
                this.children = [], this.sourceContents = {}, this.line = null == aLine ? null : aLine, 
                this.column = null == aColumn ? null : aColumn, this.source = null == aSource ? null : aSource, 
                this.name = null == aName ? null : aName, this[isSourceNode] = !0, null != aChunks && this.add(aChunks);
            }
            SourceNode.fromStringWithSourceMap = function(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
                var node = new SourceNode(), remainingLines = aGeneratedCode.split(REGEX_NEWLINE), remainingLinesIndex = 0, shiftNextLine = function() {
                    return getNextLine() + (getNextLine() || "");
                    function getNextLine() {
                        return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : void 0;
                    }
                }, lastGeneratedLine = 1, lastGeneratedColumn = 0, lastMapping = null;
                return aSourceMapConsumer.eachMapping(function(mapping) {
                    if (null !== lastMapping) {
                        if (!(lastGeneratedLine < mapping.generatedLine)) {
                            var code = (nextLine = remainingLines[remainingLinesIndex] || "").substr(0, mapping.generatedColumn - lastGeneratedColumn);
                            return remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn), 
                            lastGeneratedColumn = mapping.generatedColumn, addMappingWithCode(lastMapping, code), 
                            void (lastMapping = mapping);
                        }
                        addMappingWithCode(lastMapping, shiftNextLine()), lastGeneratedLine++, lastGeneratedColumn = 0;
                    }
                    for (;lastGeneratedLine < mapping.generatedLine; ) node.add(shiftNextLine()), lastGeneratedLine++;
                    if (lastGeneratedColumn < mapping.generatedColumn) {
                        var nextLine = remainingLines[remainingLinesIndex] || "";
                        node.add(nextLine.substr(0, mapping.generatedColumn)), remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn), 
                        lastGeneratedColumn = mapping.generatedColumn;
                    }
                    lastMapping = mapping;
                }, this), remainingLinesIndex < remainingLines.length && (lastMapping && addMappingWithCode(lastMapping, shiftNextLine()), 
                node.add(remainingLines.splice(remainingLinesIndex).join(""))), aSourceMapConsumer.sources.forEach(function(sourceFile) {
                    var content = aSourceMapConsumer.sourceContentFor(sourceFile);
                    null != content && (null != aRelativePath && (sourceFile = util.join(aRelativePath, sourceFile)), 
                    node.setSourceContent(sourceFile, content));
                }), node;
                function addMappingWithCode(mapping, code) {
                    if (null === mapping || void 0 === mapping.source) node.add(code); else {
                        var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
                        node.add(new SourceNode(mapping.originalLine, mapping.originalColumn, source, code, mapping.name));
                    }
                }
            }, SourceNode.prototype.add = function(aChunk) {
                if (Array.isArray(aChunk)) aChunk.forEach(function(chunk) {
                    this.add(chunk);
                }, this); else {
                    if (!aChunk[isSourceNode] && "string" != typeof aChunk) throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
                    aChunk && this.children.push(aChunk);
                }
                return this;
            }, SourceNode.prototype.prepend = function(aChunk) {
                if (Array.isArray(aChunk)) for (var i = aChunk.length - 1; i >= 0; i--) this.prepend(aChunk[i]); else {
                    if (!aChunk[isSourceNode] && "string" != typeof aChunk) throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
                    this.children.unshift(aChunk);
                }
                return this;
            }, SourceNode.prototype.walk = function(aFn) {
                for (var chunk, i = 0, len = this.children.length; i < len; i++) (chunk = this.children[i])[isSourceNode] ? chunk.walk(aFn) : "" !== chunk && aFn(chunk, {
                    source: this.source,
                    line: this.line,
                    column: this.column,
                    name: this.name
                });
            }, SourceNode.prototype.join = function(aSep) {
                var newChildren, i, len = this.children.length;
                if (len > 0) {
                    for (newChildren = [], i = 0; i < len - 1; i++) newChildren.push(this.children[i]), 
                    newChildren.push(aSep);
                    newChildren.push(this.children[i]), this.children = newChildren;
                }
                return this;
            }, SourceNode.prototype.replaceRight = function(aPattern, aReplacement) {
                var lastChild = this.children[this.children.length - 1];
                return lastChild[isSourceNode] ? lastChild.replaceRight(aPattern, aReplacement) : "string" == typeof lastChild ? this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement) : this.children.push("".replace(aPattern, aReplacement)), 
                this;
            }, SourceNode.prototype.setSourceContent = function(aSourceFile, aSourceContent) {
                this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
            }, SourceNode.prototype.walkSourceContents = function(aFn) {
                for (var i = 0, len = this.children.length; i < len; i++) this.children[i][isSourceNode] && this.children[i].walkSourceContents(aFn);
                var sources = Object.keys(this.sourceContents);
                for (i = 0, len = sources.length; i < len; i++) aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
            }, SourceNode.prototype.toString = function() {
                var str = "";
                return this.walk(function(chunk) {
                    str += chunk;
                }), str;
            }, SourceNode.prototype.toStringWithSourceMap = function(aArgs) {
                var generated = {
                    code: "",
                    line: 1,
                    column: 0
                }, map = new SourceMapGenerator(aArgs), sourceMappingActive = !1, lastOriginalSource = null, lastOriginalLine = null, lastOriginalColumn = null, lastOriginalName = null;
                return this.walk(function(chunk, original) {
                    generated.code += chunk, null !== original.source && null !== original.line && null !== original.column ? (lastOriginalSource === original.source && lastOriginalLine === original.line && lastOriginalColumn === original.column && lastOriginalName === original.name || map.addMapping({
                        source: original.source,
                        original: {
                            line: original.line,
                            column: original.column
                        },
                        generated: {
                            line: generated.line,
                            column: generated.column
                        },
                        name: original.name
                    }), lastOriginalSource = original.source, lastOriginalLine = original.line, lastOriginalColumn = original.column, 
                    lastOriginalName = original.name, sourceMappingActive = !0) : sourceMappingActive && (map.addMapping({
                        generated: {
                            line: generated.line,
                            column: generated.column
                        }
                    }), lastOriginalSource = null, sourceMappingActive = !1);
                    for (var idx = 0, length = chunk.length; idx < length; idx++) 10 === chunk.charCodeAt(idx) ? (generated.line++, 
                    generated.column = 0, idx + 1 === length ? (lastOriginalSource = null, sourceMappingActive = !1) : sourceMappingActive && map.addMapping({
                        source: original.source,
                        original: {
                            line: original.line,
                            column: original.column
                        },
                        generated: {
                            line: generated.line,
                            column: generated.column
                        },
                        name: original.name
                    })) : generated.column++;
                }), this.walkSourceContents(function(sourceFile, sourceContent) {
                    map.setSourceContent(sourceFile, sourceContent);
                }), {
                    code: generated.code,
                    map
                };
            }, exports.SourceNode = SourceNode;
        } ]);
    }, "object" == typeof exports && "object" == typeof module ? module.exports = factory() : "function" == typeof define && define.amd ? define([], factory) : "object" == typeof exports ? exports.sourceMap = factory() : root.sourceMap = factory();
}).apply({});

export const SourceMapGenerator = module.exports.SourceMapGenerator;

export const SourceMapConsumer = module.exports.SourceMapConsumer;

export const SourceNode = module.exports.SourceNode;

export default {
    SourceMapGenerator: module.exports.SourceMapGenerator,
    SourceMapConsumer: module.exports.SourceMapConsumer,
    SourceNode: module.exports.SourceNode,
    VERSION: "0.6.1"
};