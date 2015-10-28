/*
Copyright (c) 2014 Monohm Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

// bundled requirements for Node port

if (typeof (require) == "function")
{
	var	child_process = require ("child_process");
	var	dgram = require ("dgram");
	var	fs = require ("fs");
	var	http = require ("http");
	var	https = require ("https");
	var	mime = require ("mime");
	var	os = require ("os");
	var	path = require ("path");
	var	url = require ("url");
	
	// these are optional
	// or at least, we survive without them
	// some ports like Tessel can't do native code
	// and for SOME reason, these have native stuff going on
	
	var	musicmetadata = null;
	
	try
	{
		musicmetadata = require ("musicmetadata");
	}
	catch (inError)
	{
		console.error ("couldn't require(musicmetadata) - doing without");
	}

	var	websocket = null;
	
	try
	{
		websocket = require ("websocket");
	}
	catch (inError)
	{
		console.error ("couldn't require(websocket) - doing without");
	}
}

/**
 * Declaring the sensible namespace
 */

var	sensible = sensible || new Object ();

// ASSUME "sensible" is the first package element
// thanks to node's stupid "global" object nonsense
sensible.provide = function (inProvided)
{
	// ensure that the "packages" are there
	var	packageElements = inProvided.split (".");
	
	var	pkg = sensible;
	
	// don't make the first or last element
	// they are the extant sensible object, and the class name, respectively
	for (var i = 1; i < packageElements.length - 1; i++)
	{
		if (typeof (pkg [packageElements [i]]) == "undefined")
		{
			pkg [packageElements [i]] = new Object ();
		}
		
		pkg = pkg [packageElements [i]];
	}
};

/**
 * @param {string} inRequired
 */
sensible.require = function (inRequired)
{
	// currently we do not support dependency management
};

sensible.inherits = function (inSubClass, inSuperClass)
{
	function
	tempCtor()
	{
	};

	tempCtor.prototype = inSuperClass.prototype;
	inSubClass.superClass_ = inSuperClass.prototype;
	inSubClass.prototype = new tempCtor();
	inSubClass.prototype.constructor = inSubClass;
  
  // handy notation for "blind" superclass reference
  // as the superClass_ above won't work (needs to be off prototype)
  inSubClass.prototype.superClass = inSuperClass.prototype;
};


/**
 * Help for asynchronously traversing a list of things.
 *
 * @constructor
 * @param {object} inConfig - information regarding traversal, containing...
 * @param {object} this - the "this" to use when calling callbacks
 * @param {array} list - the list to traverse
 * @param {function} iterate - function to call with each list element
 * @param {function} complete - function to call when traversal is done
 **/

// help for traversing a list of async obtained stuff
sensible.provide ("sensible.AsyncListHelper");

sensible.AsyncListHelper = function (inConfig)
{
	this.config = inConfig;
	
	if (!this.config.this)
	{
		this.config.this = this;
	}
	
	if (this.config.list && Array.isArray (this.config.list))
	{
		this.index = 0;
		this.iterate ();
	}
	else
	{
		console.error ("no list passed to AsyncListHelper");
		this.complete ();
	}
}

sensible.AsyncListHelper.prototype.complete = function ()
{		
	if (this.config.complete)
	{
		this.config.complete.call (this.config.this);
	}
	else
	{
		console.error ("no complete function passed to AsyncListHelper");
	}
}

sensible.AsyncListHelper.prototype.iterate = function ()
{
	if (this.index < this.config.list.length)
	{
		if (this.config.iterate)
		{
			// pass our "this" first so the client always has a reliable handle on us
			this.config.iterate.call (this.config.this, this, this.config.list [this.index]);
		}
		else
		{
			console.error ("no iterate function passed to AsyncListHelper");
			this.complete ();
		}
	}
	else
	{
		this.complete ();
	}
}

/**
 * Call this when your iterate() function is done.
 */

sensible.AsyncListHelper.prototype.onIteration = function ()
{
	this.index++;
	this.iterate ();
}

// sensible.DNSPacket

sensible.provide ("sensible.DNSPacket");

sensible.DNSPacket = function ()
{
	this.id = 0;
	this.flags = 0;
	this.questions = new Array ();
	this.answers = new Array ();
	this.authorities = new Array ();
	this.additionals = new Array ();
}

// static

sensible.DNSPacket.parse = function (inBuffer)
{
	return new sensible.DNSPacketParser ().parse (inBuffer);
}

// member

sensible.DNSPacket.prototype.serialise = function ()
{
	return new sensible.DNSPacketSerialiser ().serialise (this);
}

// sensible.DNSPacketPARSER

sensible.DNSPacketParser = function ()
{
}

// take a record that has the basic types
// and adorn it with extras based on its type
sensible.DNSPacketParser.prototype.adornRecord = function (inRecord, inRecordType)
{
	// nothing to do for question records
	if (inRecordType == "question")
	{
		return;
	}
	
	if (inRecord.type == 1)
	{
		// A record
		inRecord.a = "";
		
		for (var i = 0; i < 4; i++)
		{
			if (i > 0)
			{
				inRecord.a += ".";
			}
			
			inRecord.a += inRecord.rdata [i];
		}
		
		// console.log ("found A record with address " + inRecord.a);
	}
	else if (inRecord.type == 12)
	{
		// PTR record
		inRecord.ptr = this.readRDataName (inRecord.rdata);

		// console.log ("found PTR record with ptr " + inRecord.ptr);
	}
	else if (inRecord.type == 16)
	{
		// TXT record
		inRecord.txt = this.readRDataName (inRecord.rdata);

		// console.log ("found TXT record with txt " + inRecord.txt);
	}
	else if (inRecord.type == 28)
	{
		// AAAA record
		inRecord.aaaa = "";
		
		for (var i = 0; i < 16; i++)
		{
			if (i > 0)
			{
				inRecord.aaaa += ".";
			}
			
			inRecord.aaaa += inRecord.rdata [i].toString (16);
		}
		
		// console.log ("found A record with address " + inRecord.a);
	}
	else if (inRecord.type == 33)
	{
		// SRV record
		inRecord.port = inRecord.rdata [4] << 8 | inRecord.rdata [5];
		
		// ENSURE to get the rdata from SRV, it's the HOST name not the SERVICE name
		var	view = inRecord.rdata.subarray (6);
		inRecord.hostname = this.readRDataName (view);
		
		// console.log ("found SRV record with port " + inRecord.port);
	}
	else if (inRecord.type == 47)
	{
		// NSEC record
		// inRecord.name = this.readRDataName (inRecord.rdata);
		inRecord.nsec = this.readRDataNSEC (inRecord.rdata);
	}
}

sensible.DNSPacketParser.prototype.parse = function (inBuffer)
{
	this.view = new Uint8Array (inBuffer);
	
	this.offset = 0;
	
	this.packet = new sensible.DNSPacket ();
	
	this.packet.id = this.readInteger (2);
	this.packet.flags = this.readInteger (2);

	var	questionCount = this.readInteger (2);
	var	answerCount = this.readInteger (2);
	var	authorityCount = this.readInteger (2);
	var	additionalCount = this.readInteger (2);
	
	for (var i = 0; i < questionCount; i++)
	{
		this.packet.questions.push (this.readRecord ("question"));
	}
	
	for (var i = 0; i < answerCount; i++)
	{
		this.packet.answers.push (this.readRecord ("answer"));
	}
	
	for (var i = 0; i < authorityCount; i++)
	{
		this.packet.authorities.push (this.readRecord ("authority"));
	}
	
	for (var i = 0; i < additionalCount; i++)
	{
		this.packet.additionals.push (this.readRecord ("additional"));
	}
	
	var	packet = this.packet;
	this.packet = null;
	
	return packet;
}

sensible.DNSPacketParser.prototype.readName = function (inMaxLength)
{
	if (typeof (inMaxLength) == "undefined")
	{
		// arbitrary length for when reads are defined by zero length bytes
		// rather than the length of say an rdata record
		inMaxLength = 500;
	}
	
	var	startOffset = this.offset;
	var	length = 0;
	var	name = "";
	
	do
	{
		length = this.readInteger (1);
		
		if (length > 0)
		{
			if (length >= 0xc0)
			{
				// redirect to another part of the buffer
				var	cc = this.readInteger (1);

				// ok, so the offset is really just cc
				// but technically the system supports much more
				var	extensionOffset = ((length * 256) + cc) - 49152;

				name = this.readNameExtension (extensionOffset, name);
				
				// and clip it here
				length = 0;
			}
			else
			{
				if (name.length > 0)
				{
					name += ".";
				}
				
				for (var i = 0; i < length; i++)
				{
					name += String.fromCharCode (this.readInteger (1));
				}
			}
		}
	}
	while (length > 0 && ((this.offset - startOffset) < inMaxLength));
	
	return name;
}

// note extensions CAN be recursive
// but we assume that the final recursion is properly zero-terminated
sensible.DNSPacketParser.prototype.readNameExtension = function (inOffset, ioName)
{
	var	length = 0;
	
	do
	{
		length = this.view [inOffset++];
		
		if (length > 0)
		{
			if (length >= 0xc0)
			{
				// redirect to another part of the buffer
				var	cc = this.view [inOffset++];

				// ok, so the offset is really just cc
				// but technically the system supports much more
				var	extensionOffset = ((length * 256) + cc) - 49152;

				ioName = this.readNameExtension (extensionOffset, ioName);
				
				// and clip it here
				length = 0;
			}
			else
			{
				if (ioName.length > 0)
				{
					ioName += ".";
				}
				
				for (var i = 0; i < length; i++)
				{
					ioName += String.fromCharCode (this.view [inOffset++]);
				}
			}
		}
	}
	while (length > 0);

	return ioName;
}

// free means as in reading from this buffer (extensions notwithstanding)
// and without affecting this.offset
sensible.DNSPacketParser.prototype.readRDataName = function (inBuffer)
{
	var	offset = 0;
	var	length = 0;
	var	name = "";
	
	do
	{
		length = inBuffer [offset++];
		
		if (length > 0)
		{
			if (length >= 0xc0)
			{
				// redirect to another part of the buffer
				var	cc = inBuffer [offset++];

				// ok, so the offset is really just cc
				// but technically the system supports much more
				var	extensionOffset = ((length * 256) + cc) - 49152;

				name = this.readNameExtension (extensionOffset, name);
				
				// and clip it here
				length = 0;
			}
			else
			{
				if (name.length > 0)
				{
					name += ".";
				}
				
				for (var i = 0; i < length; i++)
				{
					name += String.fromCharCode (inBuffer [offset++]);
				}
			}
		}
	}
	while (length > 0 && offset < inBuffer.byteLength);
	
	return name;
}

// note that compression is not allowed in NSEC names (yay)
sensible.DNSPacketParser.prototype.readRDataNSEC = function (inBuffer)
{
	var	offset = 0;
	var	length = 0;
	var	nsec = 
	{
		name: "",
		windows: new Array ()
	};
	
	do
	{
		length = inBuffer [offset++];

		if (length > 0)
		{
			if (length >= 0xc0)
			{
				// redirect to another part of the buffer
				var	cc = inBuffer [offset++];

				// ok, so the offset is really just cc
				// but technically the system supports much more
				var	extensionOffset = ((length * 256) + cc) - 49152;

				nsec.name = this.readNameExtension (extensionOffset, nsec.name);
				
				// and clip it here
				length = 0;
			}
			else
			{
				if (nsec.name.length > 0)
				{
					nsec.name += ".";
				}
				
				for (var i = 0; i < length; i++)
				{
					nsec.name += String.fromCharCode (inBuffer [offset++]);
				}
			}
		}
	}
	while (length > 0 && offset < inBuffer.byteLength);

	while (offset < inBuffer.byteLength)
	{
		var	window =
		{
			number: inBuffer [offset++],
			types: new Array ()
		};
		
		var	blockLength = inBuffer [offset++];
		
		for (var i = 0; i < blockLength; i++)
		{
			var	bitmap = inBuffer [offset++];

			for (var j = 0; j < 8; j++)
			{
				// it's big-bitian so we have to reverse the mask
				var	mask = 1 << (7 - j);
				
				if (bitmap & mask)
				{
					window.types.push ((i * 8) + j);
				}
			}
		}
		
		nsec.windows.push (window);
	}

	return nsec;
}

sensible.DNSPacketParser.prototype.readRecord = function (inRecordType)
{
	// console.log ("reading record of type " + inRecordType + " at offset " + this.offset);
	
	var	record = new Object ();
	
	record.name = this.readName ();
	
	record.type = this.readInteger (2);
	record.clas = this.readInteger (2);
	
	if (inRecordType != "question")
	{
		record.ttl = this.readInteger (4);

		var	rdataLength = this.readInteger (2);
		record.rdata = this.view.subarray (this.offset, this.offset + rdataLength);
		this.offset += rdataLength;
	}
	
	this.adornRecord (record, inRecordType);
	
	return record;
}

sensible.DNSPacketParser.prototype.readInteger = function (inSize)
{
	var	value = 0;
	
	for (var i = 0; i < inSize; i++)
	{
		value <<= 8;
		value |= this.view [this.offset++];
	}

	return value;
}

// sensible.DNSPacketSERIALISER

sensible.DNSPacketSerialiser = function ()
{
}

sensible.DNSPacketSerialiser.prototype.getSectionSize = function (inSection, inQuestion)
{
	var	size = 0;

	for (var i = 0; i < inSection.length; i++)
	{
		var	entry = inSection [i];
		
		// name length byte
		size++;
		
		// name length
		size += entry.name.length;

		// terminating zero
		size++;
		
		// type & class
		size += 2;
		size += 2;
		
		if (!inQuestion)
		{
			// ttl
			size += 4;
			
			// rdata length
			size += 2;
			
			if (entry.rdata)
			{
				size += entry.rdata.byteLength;
			}
		}
	}

	return size;
}

// calculate entire serialised size
sensible.DNSPacketSerialiser.prototype.getSize = function ()
{
	var	size = 0;
	
	// header - id, flags, section counts
	size += 2;
	size += 2;
	size += 8;
	
	size += this.getSectionSize (this.packet.questions, true);
	size += this.getSectionSize (this.packet.answers, false);
	size += this.getSectionSize (this.packet.authorities, false);
	size += this.getSectionSize (this.packet.additionals, false);
	
	return size;
}

sensible.DNSPacketSerialiser.prototype.serialise = function (inPacket)
{
	this.packet = inPacket;
	this.offset = 0;
	
	var	size = this.getSize ();
	this.buffer = new ArrayBuffer (size);
	this.view = new Uint8Array (this.buffer);
	
	this.writeInteger (this.packet.id, 2);
	this.writeInteger (this.packet.flags, 2);
	this.writeInteger (this.packet.questions.length, 2);
	this.writeInteger (this.packet.answers.length, 2);
	this.writeInteger (this.packet.authorities.length, 2);
	this.writeInteger (this.packet.additionals.length, 2);
	
	this.writeSection (this.packet.questions, true);
	this.writeSection (this.packet.answers, false);
	this.writeSection (this.packet.authorities, false);
	this.writeSection (this.packet.additionals, false);
	
	// check we wrote exactly what we thought we would write
	if (this.offset != size)
	{
		console.log ("caution: offset is not size after serialise");
		console.log ("offset is " + this.offset);
		console.log ("calculated size is " + size);
	}
	
	var	buffer = this.buffer;
	this.buffer = null;
	return buffer;
}

sensible.DNSPacketSerialiser.prototype.writeInteger = function (inValue, inSize)
{
	for (var i = 0; i < inSize; i++)
	{
		var	shift = ((inSize - 1) - i) * 8;
		var	byte = inValue >>> shift;
		this.view [this.offset++] = (byte & 0xff);
	}
}

// encoded as 3www6google3com0
sensible.DNSPacketSerialiser.prototype.writeName = function (inName)
{
	var	nameElements = inName.split (".");
	
	for (var i = 0; i < nameElements.length; i++)
	{
		var	nameElement = nameElements [i];
		
		this.writeInteger (nameElement.length, 1);
		
		for (var j = 0; j < nameElement.length; j++)
		{
			this.writeInteger (nameElement.charCodeAt (j), 1);
		}
	}

	this.writeInteger (0, 1);
}

sensible.DNSPacketSerialiser.prototype.writeSection = function (inSection, inQuestion)
{
	for (var i = 0; i < inSection.length; i++)
	{
		var	entry = inSection [i];

		// this includes the terminating byte
		this.writeName (entry.name);

		this.writeInteger (entry.type, 2);
		this.writeInteger (entry.clas, 2);
		
		if (!inQuestion)
		{
			this.writeInteger (entry.ttl, 4);

			if (entry.rdata)
			{
				this.writeInteger (entry.rdata.byteLength, 2);

				for (var j = 0; j < entry.rdata.byteLength; j++)
				{
					this.writeInteger (entry.rdata [j], 1);
				}
			}
			else
			{
				this.writeInteger (0, 2);
			}
		}
	}
}

/**
 * Multicast DNS based service & host discovery and registration
 *
 * @constructor
 * @param {strategy} instrategy - a strategy to use for host-dependent operations
 */

sensible.MDNS = function ()
{
	this.strategy = sensible.StrategyFactory.createStrategy ();
	
	this.foundHosts = new Object ();
	
	this.hostsByName = new Object ();
	this.hostResolutionsByName = new Object ();

	this.foundServices = new Object ();

	this.servicesByKey = new Object ();
	this.servicesByType = new Object ();
	this.serviceResolutionsByType = new Object ();
	
	// we set up a fake service record
	// for name resolution off .local
	// which we do automagically
	this.localService = new Object ();
	
	this.localService.name = this.strategy.getHostName ();
	
	if (this.localService.name && this.localService.name.length)
	{
		// some hosts give .local in this and some don't
		// we especially want to match the ones that don't
		this.localService.name = this.localService.name.replace (".local", "");
		this.localService.name = this.localService.name.toLowerCase ();
	}
	else
	{
		console.log ("MDNS() couldn't find hostname");
	}
	
	this.localService.host = this.strategy.getIPAddress ();
	
	// note the polling period should be less than the default TTL
	// polling period is in ms, TTL is in seconds, haha
	this.pollingPeriod = 30000;
	this.defaultTTL = 500;
};

/**
 * Start Multicast DNS processing.
 * Must be called prior to any request for discovery or registration.
 *
 * @param {function} inCallback - function to be called once startup is complete
 */

sensible.MDNS.prototype.start = function (inCallback)
{	
	var	self = this;
	
	this.strategy.open
	(
		5353,
		function (inError)
		{
			if (inError)
			{
				console.log ("error calling bind: " + inError.toString ());
			}
			else
			{
				self.strategy.addMembership
				(
					"224.0.0.251",
					function ()
					{
						self.strategy.listen (self.onPacketReceived.bind (self));
						self.startPolling ();
					}
				);
			}
			
			if (inCallback)
			{
				inCallback (inError);
			}
		}
	);
}

/**
 * Cancel a request to resolve a hostname to an address.
 *
 * @param {object} inResolution - resolution descriptor returned by resolveHost()
 */

sensible.MDNS.prototype.cancelResolveHost = function (inResolution)
{
	var	result = false;
	var	resolutions = this.hostResolutionsByName [inResolution.name];
	
	if (resolutions)
	{
		for (var i = 0; i < resolutions.length; i++)
		{
			if (this.resolutions [i] == inResolution)
			{
				resolutions.splice (i, 1);
				result = true;
				break;
			}
		}
	}
	
	return result;
}

/**
 * Cancel a request to discover a service type.
 *
 * @param {object} inResolution - resolution descriptor returned by resolveService()
 */

sensible.MDNS.prototype.cancelResolveService = function (inResolution)
{
	console.log ("MDNS.unregisterService(" + inResolution.type + ")");

	var	result = false;
	var	resolutions = this.serviceResolutionsByType [inResolution.type];
	
	if (resolutions)
	{
		for (var i = 0; i < resolutions.length; i++)
		{
			if (this.resolutions [i] == inResolution)
			{
				resolutions.splice (i, 1);
				result = true;
				break;
			}
		}
	}
	
	return result;
}

/**
 * Stop Multicast DNS operations.
 *
 */

sensible.MDNS.prototype.stop = function ()
{
	this.stopPolling ();
	this.strategy.close ();
}

/**
 * Register a host for proxy MDNS A record resolution.
 * Note we leave names alone, we don't remove .local or anything like that.
 *
 * @param {string} inName - name to proxy resolve, eg printer.local
 * @param {string} inHost - host to proxy resolve, eg 10.0.1.10
 */

sensible.MDNS.prototype.registerHost = function (inName, inHost)
{
	var	name = inName.toLowerCase ();
	
	if (this.hostsByName [name])
	{
		console.error ("host at " + key + " already registered...");
		return null;
	}

	// passing null or undefined for the host means "just get it"
	if (inHost == null || inHost.length == 0)
	{
		inHost = this.localService.host;
	}

	this.hostsByName [name] = inHost;
	
	return name;
}

/**
 * Register a service for proxy MDNS PTR record resolution.
 *
 * @param {string} inName - human readable service name, eg My Printer
 * @param {string} inType - type of service, eg _printer._tcp.local
 * @param {string} inHost - host of service, eg 10.0.1.10
 * @param {integer} inPort - port number of service, eg 2000
 * @param {string} inTXTRecord - optional text record to additionally serve
 */

sensible.MDNS.prototype.registerService = function (inName, inType, inHost, inPort, inTXTRecord, inTTL)
{
	console.log ("sensible.MDNS.registerService(" + inName + ")");
	
	// passing null or undefined for the host means "just get it"
	if (inHost == null || inHost.length == 0)
	{
		inHost = this.localService.host;
	}
	
	// note the key is just the host and port
	// that's really the unique combo
	var	key = inHost + ":" + inPort;
	
	if (this.servicesByKey [key])
	{
		console.error ("service at " + key + " already registered...");
		return null;
	}
	
	var	lowerCaseType = inType.toLowerCase ();
	
	var	service = 
	{
		name: inName,
		type: lowerCaseType,
		host: inHost,
		port: inPort,
		text: inTXTRecord,
		ttl: inTTL ? inTTL : this.defaultTTL
	};
	
	this.servicesByKey [key] = service;

	if (this.servicesByType [lowerCaseType])
	{
		// there can't be a dupe, we'd have found it above
		// so just add to the existing list
	}
	else
	{
		this.servicesByType [lowerCaseType] = new Array ();
	}
	
	this.servicesByType [lowerCaseType].push (service);

	// ensure that everyone has up to date info
	this.sendPTRResponse (service);

	return service;
}

/**
 * Request notification of name to host resolutions.
 *
 * @param {string} inName - name to resolve, eg printer.local
 * @param {function} inCallback - function to call on resolution
 * @returns {object} object to provide to unresolveHost() call to cancel
 */

sensible.MDNS.prototype.resolveHost = function (inName, inAddCallback, inRemoveCallback)
{
	var	lowerCaseName = inName.toLowerCase ();
	var	resolutions = this.hostResolutionsByName [lowerCaseName];
	
	if (!resolutions)
	{
		resolutions = new Array ();
		this.hostResolutionsByName [lowerCaseName] = resolutions;
	}
	
	var	resolution = 
	{
		name: lowerCaseName,
		addCallback: inAddCallback,
		removeCallback: inRemoveCallback,
		hosts: new Object ()
	};
	
	resolutions.push (resolution);
	
	this.sendARequest (lowerCaseName);
	
	return resolution;
}

/**
 * Request notification of service resolutions.
 *
 * @param {string} inType - type to resolve, eg _printer._tcp.local
 * @param {function} inCallback - function to call on resolution
 * @returns {object} object to provide to unresolveService() call to cancel
 */
sensible.MDNS.prototype.resolveService = function (inType, inAddCallback, inRemoveCallback)
{
	console.log ("MDNS.resolveService(" + inType + ")");
	
	var	lowerCaseType = inType.toLowerCase ();
	var	resolutions = this.serviceResolutionsByType [lowerCaseType];
	
	if (!resolutions)
	{
		resolutions = new Array ();
		this.serviceResolutionsByType [lowerCaseType] = resolutions;
	}
	
	var	resolution = 
	{
		type: lowerCaseType,
		addCallback: inAddCallback,
		removeCallback: inRemoveCallback,
		services: new Object ()
	};
	
	resolutions.push (resolution);
	
	this.sendPTRRequest (lowerCaseType);
	
	return resolution;
}

/**
 * Cancel notification of host resolutions.
 *
 * @param {string} inName - name to cancel resolution, eg printer.local
 */
sensible.MDNS.prototype.unregisterHost = function (inName)
{
	var	unregistered = false;
	
	var	host = this.hostsByName [inName.toLowerCase ()];
	
	if (host)
	{
		unregistered = true;
		delete this.hostsByName [name];
	}
	else
	{
		console.error ("name " + name + " not registered...");
	}
	
	return unregistered;
}

/**
 * Cancel the advertisement of a service.
 *
 * @param {string} inHost - host of service to cancel, eg 10.0.1.10
 * @param {integer} inPort - port number of service to cancel, eg 2000
 */
sensible.MDNS.prototype.unregisterService = function (inHost, inPort)
{
	var	unregistered = false;
	
	// passing null or undefined for the host means "just get it"
	if (inHost == null || inHost.length == 0)
	{
		inHost = this.localService.host;
	}
	
	var	key = inHost + ":" + inPort;
	
	var	service = this.servicesByKey [key];

	if (service)
	{
		unregistered = true;
		
		// service.type is lowercased by register()
		var	services = this.servicesByType [service.type];
		
		for (var i = 0; i < services.length; i++)
		{
			if (services [i].host == inHost && services [i].port == inPort)
			{
				services.splice (i, 1);
				break;
			}
		}

		delete this.servicesByKey [key];
	}
	else
	{
		console.error ("service " + key + " not registered...");
	}
	
	return unregistered;
}

// CALLBACKS

/**
 * Called by the configured strategy upon receipt of a packet.
 *
 * @private
 * @param {ArrayBuffer} inPacketBuffer - packet
 * @param {string} inRemoteHost - originating host, eg 10.0.1.11
 * @param {integer} inRemotePort - originating port, eg 2000
 */
sensible.MDNS.prototype.onPacketReceived = function (inPacketBuffer, inRemoteHost, inRemotePort)
{
	var	packet = sensible.DNSPacket.parse (inPacketBuffer);
	
	if (packet.flags & 0x8000)
	{
		// this is a response
		if (packet.answers.length > 0)
		{
			var	answer = null;
			
			for (var i = 0; i < packet.answers.length; i++)
			{
				// dns record type 1 = A
				if (packet.answers [i].type == 1)
				{
					answer = packet.answers [i];

					var	lowerCaseName = answer.name.toLowerCase ();
					// console.log ("received A response for " + lowerCaseName);
					
					var	resolutions = this.hostResolutionsByName [lowerCaseName];
					
					if (resolutions)
					{
						var	host = this.getHostInfo (answer);
						this.foundHosts [lowerCaseName] = host;
						
						// find outstanding resolutions for this host
						for (var i = 0; i < resolutions.length; i++)
						{
							if (resolutions [i].addCallback)
							{
								if (resolutions [i].hosts [host.key])
								{
									// this client already knows about this host
									// console.log ("client already knows about host " + host.key);
								}
								else
								{
									resolutions [i].addCallback (host);
								}
							}
						}
					}
				}
				else
				// dns record type 12 = PTR
				if (packet.answers [i].type == 12)
				{
					answer = packet.answers [i];

					var	lowerCaseType = answer.name.toLowerCase ();
					// console.log ("received PTR response for " + lowerCaseType);
					
					// are we tracking this type?
					var	resolutions = this.serviceResolutionsByType [lowerCaseType];
					
					if (resolutions)
					{
						// ok, remix the packet into something sensible
						var	service = this.getServiceInfo (packet, inRemoteHost, lowerCaseType);
						this.foundServices [service.key] = service;
					
						for (var i = 0; i < resolutions.length; i++)
						{
							if (resolutions [i].addCallback)
							{
								if (resolutions [i].services [service.key])
								{
									// this client already knows about this service
									console.log ("client already knows about service " + service.key);
								}
								else
								{
									resolutions [i].services [service.key] = true;
									resolutions [i].addCallback (service);
								}
							}
						}
					}
					else
					{
						// i think the system works well enough to remove this log now :-)
						// console.log ("no resolutions outstanding for " + lowerCaseType);
					}
				}
			}
		}
	}
	else
	{
		// this is a request, possibly
		if (packet.questions.length > 0)
		{
			var	question = packet.questions [0];
		
			// dns record type 1 = A
			if (question.type == 1)
			{
				var	hostName = question.name.toLowerCase ();
				// console.log ("received A request for " + hostName);

				// console.log ("request for A record for " + hostName);

				// console.log ("checking " + hostName + " against " + this.localService.name);
				
				if (hostName == this.localService.name)
				{
					this.sendAResponse (hostName, this.localService.host);
				}
				else
				{
					// could be a proxy host registration for someone else...
					var	host = this.hostsByName [hostName];
					
					if (host)
					{
						this.sendAResponse (hostName, host);
					}
				}
			}
			else
			// dns record type 12 = PTR
			if (question.type == 12)
			{
				// service type should be something like _appletv._tcp.local
				var	lowerCaseType = question.name.toLowerCase ();
				// console.log ("received PTR request for " + lowerCaseType);

				// console.log ("received request for type " + lowerCaseType + " with length " + inPacketBuffer.byteLength);
	
				var	services = this.servicesByType [lowerCaseType];
				
				if (services)
				{
					// console.log ("found " + services.length + " services registered for " + lowerCaseType);
	
					for (var i = 0; i < services.length; i++)
					{
						this.sendPTRResponse (services [i]);
					}
				}
			}
		}
	}
	
	return packet;	
}

// PRIVATE

/**
 * Inform the clients of this host that it has been removed.
 *
 * @private
 * @param {object} inHost - host to expire
 */

sensible.MDNS.prototype.expireHost = function (inHost)
{
	var	resolutions = this.hostResolutionsByName [inHost.name];
	
	if (resolutions)
	{
		for (var i = 0; i < resolutions.length; i++)
		{
			if (resolutions [i].removeCallback)
			{
				resolutions [i].removeCallback (inHost);
			}
		}
	}
}

/**
 * Inform the clients of this service that it has been removed.
 *
 * @private
 * @param {object} inService - service to expire
 */

sensible.MDNS.prototype.expireService = function (inService)
{
	var	resolutions = this.serviceResolutionsByType [inService.type];
	
	if (resolutions)
	{
		for (var i = 0; i < resolutions.length; i++)
		{
			if (resolutions [i].removeCallback)
			{
				resolutions [i].removeCallback (inService);
			}
		}
	}
}

/**
 * Remove any hosts whose TTL has expired, informing their clients.
 * The assumption is that the TTL period is greater than the polling period.
 *
 * @private
 */

sensible.MDNS.prototype.expireHosts = function ()
{
	var	now = new Date ().getTime ();
	
	for (var name in this.foundHosts)
	{
		var	host = this.foundHosts [name];
		
		// each service has a TTL and a timestamp when it was last discovered
		// so combine the two to find the expiry in ms, and check...
		var	expiryTime = host.timestamp + (host.ttl * 1000);
		
		if (expiryTime < now)
		{
			console.log ("expiring service: " + key);
			
			this.expireHost (service);
			
			delete this.foundHosts [key];
		}
	}
}

/**
 * Remove any services whose TTL has expired, informing their clients.
 * The assumption is that the TTL period is greater than the polling period.
 *
 * @private
 */

sensible.MDNS.prototype.expireServices = function ()
{
	var	now = new Date ().getTime ();
	
	for (var key in this.foundServices)
	{
		var	service = this.foundServices [key];
		
		// each service has a TTL and a timestamp when it was last discovered
		// so combine the two to find the expiry in ms, and check...
		var	expiryTime = service.timestamp + (service.ttl * 1000);
		
		if (expiryTime < now)
		{
			console.log ("expiring service: " + key);
			
			this.expireService (service);
			
			delete this.foundServices [key];
		}
	}
}

/**
 * Extract the pertinent information from an A type DNS packet.
 *
 * @private
 * @param {ArrayBuffer} inPacketBuffer - packet
 * @returns {object} object containing name, address, and TTL
 */

sensible.MDNS.prototype.getHostInfo = function (inARecord)
{
	// note the default TTL should be more than the polling period (60 seconds)
	// we set it to five minutes, here
	var	host = 
	{
		name: inARecord.name.toLowerCase (),
		address: inARecord.a,
		ttl: inARecord.ttl,
		rdata: inARecord.rdata,
		timestamp: new Date ().getTime ()
	};
	
	if ((host.ttl * 1000) < this.pollingPeriod)
	{
		host.ttl = this.defaultTTL;
	}

	// abstracting how we make the key == good
	host.key = host.name;
	
	return host;
}

	
/**
 * Extract the pertinent information from a PTR type DNS packet.
 *
 * @private
 * @param {ArrayBuffer} inPacketBuffer - packet
 * @param {string} inRemoteHost - originating host, eg 10.0.1.11
 * @param {string} inType - type of resolution, eg _printer._tcp.local
 * @returns {object} object containing name, type, host, port, text, and TTL
 */

sensible.MDNS.prototype.getServiceInfo = function (inPacket, inRemoteHost, inType)
{
	// note the default TTL should be more than the polling period (60 seconds)
	// we set it to five minutes, here
	var	service = 
	{
		name: "",
		type: inType,
		host: inRemoteHost,
		port: 0,
		text: "",
		ttl: this.defaultTTL,
		timestamp: new Date ().getTime ()
	};
	
	var	updatedTTL = false;
	
	for (var i = 0; i < inPacket.answers.length; i++)
	{
		var	answer = inPacket.answers [i];
		
		if (answer.type == 12)
		{
			// PTR record
			
			// help out a little here by separating the name from the type
			// the packet combines, but IMHO it's more useful separate
			// remember the stray delimiter between the name & type
			service.name = answer.ptr.replace ("." + inType, "");
			service.ttl = answer.ttl;
			
			updatedTTL = true;
		}
		else if (answer.type == 16)
		{
			// TXT record
			service.text = answer.txt;

			// don't override the PTR record's TTL
			if (!updatedTTL)
			{
				service.ttl = answer.ttl;
			}
		}
	}
	
	if ((service.ttl * 1000) < this.pollingPeriod)
	{
		service.ttl = this.defaultTTL;
	}
	
	// now trawl the additionals for extra bits
	for (var i = 0; i < inPacket.additionals.length; i++)
	{
		var	additional = inPacket.additionals [i];
		
		if (additional.type == 1)
		{
			// A record
			service.host = additional.a;
		}
		else if (additional.type == 16)
		{
			// TXT record
			
			// but if we got a TXT in the answer, don't override it here
			if (service.text == null || service.text.length == 0)
			{
				service.text = additional.txt;
			}
		}
		else if (additional.type == 33)
		{
			// SRV record
			service.port = additional.port;
		}
	}
	
	// rig up a unique key
	service.key = service.name  + "." + service.type + ":" + service.host + ":" + service.port;
	
	return service;
}

sensible.MDNS.prototype.makeARecord = function (inService)
{
	// add an A additional for the host
	var	hostElements = inService.host.split (".");
	var	aBuffer = new ArrayBuffer (4);
	var	aView = new Uint8Array (aBuffer);
	
	for (var j = 0; j < 4; j++)
	{
		var	digit = parseInt (hostElements [j]);
		aView [j] = digit;
	}

	var	aRecord = 
	{
		name: inService.name,
		type: 1,
		clas: 1,
		ttl: this.defaultTTL,
		rdata: aView
	};

	return aRecord;
}

sensible.MDNS.prototype.makeHostNSECRecord = function ()
{
	// calculate the size of the buffer
	var	hostName = this.strategy.getHostName ();
	var	length = 1 + hostName.length + 1;
	
	// 1 for the window block number (0)
	// 1 for the block length (4 for a host NSEC record)
	// 4 bytes of bitmap shit
	length += 6;

	var	buffer = new ArrayBuffer (length);
	var	view = new Uint8Array (buffer);
	
	var	offset = 0;
	
	var	nameElements = hostName.split (".");
	
	for (var i = 0; i < nameElements.length; i++)
	{
		var	nameElement = nameElements [i];
		
		view [offset++] = nameElement.length;
		
		for (var j = 0; j < nameElement.length; j++)
		{
			view [offset++] = nameElement.charCodeAt (j);
		}
	}
	
	// terminating the name
	view [offset++] = 0;
	
	// window block 0 & length
	view [offset++] = 0;
	view [offset++] = 4;
	
	// bitmap for RR types 1 and 28
	view [offset++] = 0x40;
	view [offset++] = 0;
	view [offset++] = 0;
	view [offset++] = 0x08;
	
	if (offset != length)
	{
		console.log ("makeHostNSECRecord() offset length error");
		console.log ("offset is " + offset + ", but length is " + length);
	}
	
	var	record = 
	{
		name: this.strategy.getHostName (),
		type: 47,
		clas: 1,
		ttl: this.defaultTTL,
		rdata: view
	}
	
	return record;
}

// HACK
sensible.MDNS.prototype.makeServiceNSECRecord = function (inService)
{
	// calculate the size of the buffer
	var	fullServiceName = inService.name + "." + inService.type.toLowerCase ();
	var	length = 1 + fullServiceName.length + 1;
	
	// 1 for the window block number (0)
	// 1 for the block length (4 for a host NSEC record)
	// 5 bytes of bitmap shit
	length += 7;

	var	buffer = new ArrayBuffer (length);
	var	view = new Uint8Array (buffer);
	
	var	offset = 0;
	
	var	nameElements = fullServiceName.split (".");
	
	for (var i = 0; i < nameElements.length; i++)
	{
		var	nameElement = nameElements [i];
		
		view [offset++] = nameElement.length;
		
		for (var j = 0; j < nameElement.length; j++)
		{
			view [offset++] = nameElement.charCodeAt (j);
		}
	}
	
	// terminating the name
	view [offset++] = 0;
	
	// window block 0 & length
	view [offset++] = 0;
	view [offset++] = 5;
	
	// bitmap for RR types 16 and 33
	view [offset++] = 0;
	view [offset++] = 0;
	view [offset++] = 0x80;
	view [offset++] = 0;
	view [offset++] = 0x40;
	
	if (offset != length)
	{
		console.log ("makeServiceNSECRecord() offset length error");
		console.log ("offset is " + offset + ", but length is " + length);
	}
	
	var	record = 
	{
		name: inService.name + "." + inService.type.toLowerCase (),
		type: 47,
		clas: 1,
		ttl: 120,
		rdata: view
	}
	
	return record;
}

sensible.MDNS.prototype.makePTRRecord = function (inService)
{
	var	fullServiceName = inService.name + "." + inService.type.toLowerCase ();

	var	ptrBuffer = new ArrayBuffer (1 + fullServiceName.length + 1);
	var	ptrView = new Uint8Array (ptrBuffer);
	
	var	offset = 0;
	
	// god i fucking hate this format
	var	nameElements = fullServiceName.split (".");
	
	for (var i = 0; i < nameElements.length; i++)
	{
		var	nameElement = nameElements [i];
		
		ptrView [offset++] = nameElement.length;
		
		for (var j = 0; j < nameElement.length; j++)
		{
			ptrView [offset++] = nameElement.charCodeAt (j);
		}
	}

	ptrView [offset++] = 0;

	var	ptrRecord =
	{
		name: inService.type.toLowerCase (),
		type: 12,
		clas: 1,
		ttl: inService.ttl,
		rdata: ptrView
	};
	
	return ptrRecord;
}

// ok, this rogered things for a while
// the NAME of the SRV record should be the full service name
// the RDATA should be the port etc and the HOST NAME, not the service name
sensible.MDNS.prototype.makeSRVRecord = function (inService)
{
	// denormalise the server name, fuck the compression
	var	serverName = this.strategy.getHostName ();

	// add an SRV additional for the port (sigh)
	// priority, weight, port, length byte, service name + .local + trailing zero
	var	srvSize = 6 + 1 + serverName.length + 1;
	var	srvBuffer = new ArrayBuffer (srvSize);
	var	srvView = new Uint8Array (srvBuffer);
	
	// priority & weight are zero
	var	offset = 0;
	srvView [offset++] = 0;
	srvView [offset++] = 0;
	srvView [offset++] = 0;
	srvView [offset++] = 0;
	
	// port
	srvView [offset++] = inService.port >> 8;
	srvView [offset++] = inService.port & 0xff;
	
	// god i fucking hate this format
	var	nameElements = serverName.split (".");
	
	for (var i = 0; i < nameElements.length; i++)
	{
		var	nameElement = nameElements [i];
		
		srvView [offset++] = nameElement.length;
		
		for (var j = 0; j < nameElement.length; j++)
		{
			srvView [offset++] = nameElement.charCodeAt (j);
		}
	}

	srvView [offset++] = 0;

	var	srvRecord = 
	{
		name: inService.name + "." + inService.type.toLowerCase (),
		type: 33,
		clas: 1,
		ttl: 120,
		rdata: srvView
	};

	return srvRecord;
}

sensible.MDNS.prototype.makeTXTRecord = function (inService)
{
	if (inService.text == null)
	{
		// this happens all the time
		inService.text = "";
	}
	
	var	txtBuffer = new ArrayBuffer (1 + inService.text.length);
	var	txtView = new Uint8Array (txtBuffer);
	
	var	offset = 0;
	
	txtView [offset++] = inService.text.length;
	
	// this is TXT, so we can not do the fucked format
	for (var i = 0; i < inService.text.length; i++)
	{
		txtView [offset++] = inService.text.charCodeAt (i);
	}

	var	txt =
	{
		name: inService.name + "." + inService.type.toLowerCase (),
		type: 16,
		clas: 1,
		ttl: inService.ttl,
		rdata: txtView
	};
	
	return txt;
}

sensible.MDNS.prototype.logPacket = function (inPacket)
{
	console.log ("LOG PACKET");
	console.log ("id = " + inPacket.id);
	console.log ("flags = " + inPacket.flags.toString (16));
	console.log ("qucount = " + inPacket.questions.length);
	console.log ("ancount = " + inPacket.answers.length);
	console.log ("aucount = " + inPacket.authorities.length);
	console.log ("adcount = " + inPacket.additionals.length);

	for (var i = 0; i < inPacket.questions.length; i++)
	{
		var	question = inPacket.questions [i];
		
		console.log ("question " + i);
		console.log ("name = " + question.name);
	}

	for (var i = 0; i < inPacket.answers.length; i++)
	{
		var	answer = inPacket.answers [i];
		
		console.log ("ANSWER " + i);
		console.log ("name = " + answer.name);
		console.log ("type = " + answer.type);
		console.log ("class = " + answer.clas);
		console.log ("ttl = " + answer.ttl);

		if (answer.type == 1)
		{
			console.log ("address = " + answer.a);
		}
		else
		if (answer.type == 12)
		{
			console.log ("ptr = " + answer.ptr);
		}
		else
		if (answer.type == 16)
		{
			console.log ("text = " + answer.txt);
		}
		else
		if (answer.type == 28)
		{
			console.log ("aaaa = " + answer.aaaa);
		}
		else
		if (answer.type == 33)
		{
			console.log ("port = " + answer.port);
		}
		else
		{
			console.log ("unknown answer type " + answer.type);
		}
	}
	
	for (var i = 0; i < inPacket.additionals.length; i++)
	{
		var	additional = inPacket.additionals [i];
		
		console.log ("ADDITIONAL " + i);
		console.log ("name = " + additional.name);
		console.log ("type = " + additional.type);
		console.log ("ttl = " + additional.ttl);

		if (additional.type == 1)
		{
			console.log ("address = " + additional.a);
		}
		else
		if (additional.type == 12)
		{
			console.log ("ptr = " + additional.ptr);
		}
		else
		if (additional.type == 16)
		{
			console.log ("text = " + additional.txt);
		}
		else
		if (additional.type == 28)
		{
			console.log ("aaaa = " + additional.aaaa);
		}
		else
		if (additional.type == 33)
		{
			console.log ("port = " + additional.port);
		}
		else
		if (additional.type == 47)
		{
			if (false)
			{
				console.log ("nsec hack name = " + additional.name);
			}
			else
			{
				console.log ("nsec name = " + additional.nsec.name);
				
				for (var j = 0; j < additional.nsec.windows.length; j++)
				{
					var	window = additional.nsec.windows [j];
	
					console.log ("nsec window " + window.number);
					console.log ("nsec types " + window.types);
				}
			}
		}
		else
		{
			console.log ("unknown answer type " + additional.type);
		}
	}
}

sensible.MDNS.prototype.sendARequest = function (inName)
{
	// console.log ("sending question for " + inType);
	
	var	packet = new sensible.DNSPacket ();
	packet.id = 0;
	packet.flags = 0;
	
	var	question =
	{
		name: inName,
		type: 1,
		clas: 1
	}
	
	packet.questions.push (question);

	var	buffer = packet.serialise ();
	this.strategy.send (buffer, "224.0.0.251", 5353);
}

sensible.MDNS.prototype.sendAResponse = function (inName, inHost)
{
	var	packet = new sensible.DNSPacket ();
	packet.id = 0;
	packet.flags = 0x8400;
	
	var	service = null;
	
	if (inName)
	{
		service =
		{
			name: inName,
			host: inHost
		};
	}
	else
	{
		service = this.localService;
	}
	
	packet.answers.push (this.makeARecord (service));

	// console.log ("sending A response for " + service.name + " (" + service.host + ")");
	
	var	buffer = packet.serialise ();
	this.strategy.send (buffer, "224.0.0.251", 5353);
}

sensible.MDNS.prototype.sendPTRRequest = function (inType)
{
	console.log ("sending question for " + inType);
	
	var	packet = new sensible.DNSPacket ();
	packet.id = 0;
	packet.flags = 0;
	
	var	question =
	{
		name: inType,
		type: 12,
		clas: 1
	}
	
	packet.questions.push (question);

	var	buffer = packet.serialise ();
	this.strategy.send (buffer, "224.0.0.251", 5353);
}

sensible.MDNS.prototype.sendPTRResponse = function (inService)
{
	var	packet = new sensible.DNSPacket ();
	packet.id = 0;
	packet.flags = 0x8400;

	packet.answers.push (this.makePTRRecord (inService));
	packet.additionals.push (this.makeARecord (inService));
	packet.additionals.push (this.makeTXTRecord (inService));
	packet.additionals.push (this.makeSRVRecord (inService));
	// packet.additionals.push (this.makeHostNSECRecord (inService));
	// packet.additionals.push (this.makeServiceNSECRecord (inService));

	var	buffer = packet.serialise ();

	this.strategy.send (buffer, "224.0.0.251", 5353);
}

/**
 * Poll to refresh the type and host tables.
 * Simplistic, but it works.
 * The only issue is that the polling period has to be less than TTL.
 */

sensible.MDNS.prototype.startPolling = function ()
{
	var	self = this;
	
	this.poller = setInterval
	(
		function ()
		{
			for (var type in self.serviceResolutionsByType)
			{
				self.sendPTRRequest (type);
			}

			for (var name in self.addressResolutionsByType)
			{
				self.sendARequest (name);
			}
			
			self.expireHosts ();
			self.expireServices ();
		},
		this.pollingPeriod
	);
}

sensible.MDNS.prototype.stopPolling = function ()
{
	if (this.poller)
	{
		clearInterval (this.poller);
		this.poller = null;
	}
	else
	{
		console.log ("stopPolling() called with no poller task");
	}
}
sensible.provide ("sensible.RESTDispatcher");

sensible.RESTDispatcher = new Object ();

sensible.RESTDispatcher.dispatchRequest = function (inRequest, inDelegate, inCallback)
{
	var	sync = true;
	var	response = new Object ();
	
	var	pathElements = inRequest.url.pathname.toLowerCase ().split ("/");
	
	if (pathElements.length == 1 && pathElements [0].length > 0)
	{
		// requesting something with no initial slash
		response.type = "file";
		response.path = pathElements [0];
		
		inCallback (response);
	}
	else
	if (pathElements.length <= 2)
	{
		// likely, we will get 2 path elements for "/"
		if (pathElements [1].length == 0)
		{
			response.type = "file";
			response.path = "index.html";
		}
		else
		{
			// no controller & action -> request for file
			response.type = "file";
			response.path = pathElements [1];
		}
		
		inCallback (response);
	}
	else
	{
		var	controller = pathElements [1].toLowerCase ();
		var	action = pathElements [2].toLowerCase ();

		var	handler = inDelegate [controller + "_" + action];
		
		if (typeof (handler) == "function")
		{
			var	object = handler.call
			(
				inDelegate,
				inRequest,
				function (inResponse)
				{
					inCallback (inResponse);
				}
			);
			
			if (object)
			{
				console.error ("REST handler returned object, deprecated behaviour");

				var	response = new Object ();
				response.type = "json";
				response.object = object;
				
				inCallback (response);
			}
		}
		else
		{
			// serve out a file instead
			pathElements.splice (0, 1);
			
			response.type = "file";
			response.path = pathElements.join ("/");
			
			inCallback (response);
		}
	}
}

sensible.RESTDispatcher.dispatchMessage = function (inMessage, inDelegate)
{
	var	response = new Object ();

	var	handler = inDelegate [inMessage.controller + "_" + inMessage.action];
	
	if (typeof (handler) == "function")
	{
		response.type = "json";
		response.object = handler.call (inDelegate, inMessage);
	}
	else
	{
		// serve out a file instead
		pathElements.splice (0, 1);
		
		response.type = "file";
		response.path = pathElements.join ("/");
	}
	
	return response;
}
sensible.provide ("sensible.WebServer");

sensible.WebServer = function (inCallback)
{
	this.callback = inCallback;
	
	this.request = new Object ();
	this.request.headers = new Object ();
	this.request.data = "";
	
	this.line = "";
	this.delimiter = 0;
	this.reading = true;
	this.readingHeaders = true;
	this.postLength = 0;
}

// DELEGATE METHODS FROM PLATFORM SPECIFIC SOCKET CALLBACKS

sensible.WebServer.prototype.onData = function (inData)
{
	if (typeof (inData) == "string")
	{
		this.onReadString (inData);
	}
	else
	if (typeof (inData) == "object")
	{
		this.onReadBuffer (inData);
	}
	else
	{
		console.error ("sensible.WebServer.onData() with unidentified data type");
		console.error (inData);
	}
}

// PRIVATE

sensible.WebServer.prototype.onEnd = function ()
{
	// thou shalt read no more
	this.reading = false;
	
	// since we basically know we're in a browser
	// do some helpful parsing and converting on the request
	var	anchor = document.createElement ("a");
	anchor.href = this.request.url;
	
	// note that we only get the server-side URL here and not the full thing
	// eg /mdns/register?name=fridge
	this.request.url = new Object ();
	this.request.url.pathname = anchor.pathname;
	this.request.url.search = anchor.search.replace ("?", "");
	this.request.url.hash = anchor.hash.replace ("#", "");

	if (this.request.method == "POST")
	{
		this.request.parameters = this.parseParameters (this.request.data);
	}
	else
	{
		this.request.parameters = this.parseParameters (this.request.url.search);
	}
	
	this.callback (this.request);
}

sensible.WebServer.prototype.onReadBuffer = function (inBuffer)
{
	// console.log ("sensible.WebServer.onReadBuffer() with " + inBuffer.byteLength + " bytes");

	if (!this.reading)
	{
		return;
	}
	
	var	view = new Uint8Array (inBuffer);
	
	for (var i = 0; i < view.byteLength; i++)
	{
		var	ch = String.fromCharCode (view [i]);
		
		if (this.readingHeaders)
		{
			if (ch == "\r" || ch == "\n")
			{
				if (this.delimiter)
				{
					if (this.delimiter == ch)
					{
						// we have a new line
						this.onLine ();
					}
					else
					{
						// it's the other line delimiter
						// ignore
					}
				}
				else
				{
					this.delimiter = ch;
					
					this.onLine ();
				}
			}
			else
			{
				this.line += ch;
			}
		}
		else
		{
			// reading POST data
			this.request.data += ch;
			
			if (this.request.data.length == this.postLength)
			{
				this.onEnd ();
			}
		}
	}
}

sensible.WebServer.prototype.onReadString = function (inString)
{
	// console.log ("sensible.WebServer.onReadString() with " + inString.length + " bytes");

	if (!this.reading)
	{
		return;
	}
	
	for (var i = 0; i < inString.length; i++)
	{
		var	ch = inString.charAt (i);
		
		if (this.readingHeaders)
		{
			if (ch == "\r" || ch == "\n")
			{
				if (this.delimiter)
				{
					if (this.delimiter == ch)
					{
						// we have a new line
						this.onLine ();
					}
					else
					{
						// it's the other line delimiter
						// ignore
					}
				}
				else
				{
					this.delimiter = ch;
					
					this.onLine ();
				}
			}
			else
			{
				this.line += ch;
			}
		}
		else
		{
			// reading POST data
			this.request.data += ch;
			
			if (this.request.data.length == this.postLength)
			{
				this.onEnd ();
			}
		}
	}
}

sensible.WebServer.prototype.onLine = function ()
{
	if (this.line.length)
	{
		if (this.request.method)
		{
			// must be a header line
			var	elements = this.line.split (":");
			var	key = this.stripSpaces (elements [0]).toLowerCase ();
			var	value = this.stripSpaces (elements [1]);
			this.request.headers [key] = value;
		}
		else
		{
			// must be the first line
			var	elements = this.line.split (" ");
			this.request.method = elements [0].toUpperCase ();
			this.request.url = elements [1];
		}
		
		this.line = "";
	}
	else
	{
		// end of header section
		this.readingHeaders = false;
		
		if (this.request.method == "POST")
		{
			var	contentLengthString = this.request.headers ["content-length"];
			
			if (contentLengthString && contentLengthString.length)
			{
				this.postLength = parseInt (contentLengthString);

				// go off and read the POST data
			}
			else
			{
				// no content length? sorry dude
				console.log ("POST method with no content length");
				this.reading = false;
				
				this.onEnd ();
			}
		}
		else
		{
			this.onEnd ();
		}
	}
}

sensible.WebServer.prototype.parseParameters = function (inParamString)
{
	var	parameters = new Object ();
	
	var	parameterElements = inParamString.split ("&");
	
	for (var i = 0; i < parameterElements.length; i++)
	{
		var	keyAndValue = parameterElements [i].split ("=");
		
		if (keyAndValue [0] && keyAndValue [0].length
			&& keyAndValue [1] && keyAndValue [1].length)
		{
			var	key = decodeURIComponent (this.stripSpaces (keyAndValue [0]));
			var	value = decodeURIComponent (this.stripSpaces (keyAndValue [1]));
			
			parameters [key] = value;
		}
	}
	
	return parameters;
}

sensible.WebServer.prototype.stripSpaces = function (inString)
{
	return inString.replace (sensible.WebServer.kStripSpacesRegEx, "");
}

sensible.WebServer.kStripSpacesRegEx = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
sensible.provide ("sensible.Application");

/**
 * Application which advertises via MDNS and serves via HTTP
 *
 * @constructor
 * @param {function} inCallback - function to call on completion
 */

sensible.Application = function (inCallback)
{
	console.log ("sensible.Application()");
	
	// do this first, so it's valid throughout the startup process
	gSensibleApplication = this;
	
	var	self = this;
	
	this.loadConfig
	(
		function (inError)
		{
			if (inError)
			{
				console.log ("error loading config...");
				console.log (inError);
				
				// careful here, Ajax will call your error handler
				// if your success handler throws
				if (inCallback)
				{
					try
					{
						inCallback.call (self, inError);
					}
					catch (inError)
					{
						if (inError)
						{
							inCallback.call (self, inError);
						}
					}
				}
			}
			else
			{
				self.loadProperties
				(
					function (inError)
					{
						if (inError)
						{
							console.log ("error loading properties...");
							console.log (inError);
						}
						else
						{
							self.onBeforeStart
							(
								function ()
								{
									try
									{
										self.start
										(
											function (inError)
											{
												if (inError)
												{
													inCallback.call (self, inError);
												}
												else
												{
													self.onAfterStart
													(
														function ()
														{
															inCallback.call (self);
														}
													);
												}
											}
										);
									}
									catch (inError)
									{
										if (inError)
										{
											inCallback.call (self, inError);
										}
									}
								}
							);
						}
					}
				);
			}
		}
	);
}

/**
 * Return the value of a specific property
 *
 * @param {string} inName - name of property to return
 */
 
sensible.Application.prototype.getProperty = function (inName)
{
	var	value = null;
	
	var	property = this.propertiesByKey [inName];
	
	if (property)
	{
		value = property.value;
	}
	else
	{
		console.error ("sensible.Application.getProperty() can't find property for name " + inName);
	}
}

/**
 * Set the value of a specific property
 *
 * @param {string} inName - name of property whose value to set
 * @param {object} inValue - value
 */
 
sensible.Application.prototype.setProperty = function (inName, inValue)
{
	var	property = this.propertiesByKey [inName];
	
	if (property)
	{
		property.value = inValue;
	}
	else
	{
		console.error ("sensible.Application.setProperty() can't find property for name " + inName);
	}
}

// APPLICATION INTERFACE

/**
 * Do app-specific tasks immediately prior to running start()
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.onBeforeStart = function (inCallback)
{
	console.log ("Application.onBeforeStart()");
	inCallback ();
}

/**
 * Do app-specific tasks immediately after running start()
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.onAfterStart = function (inCallback)
{
	console.log ("Application.onAfterStart()");
	inCallback ();
}

// PLATFORM INTERFACE

/**
 * Load configuration - by default from sensible-config.json
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.loadConfig = function (inCallback)
{
	throw new Error ("sensible.Application.loadConfig() called - abstract");
}

/**
 * Load properties - by default from sensible-properties.json
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.loadProperties = function (inCallback)
{
	throw new Error ("sensible.Application.loadProperties() called - abstract");
}

/**
 * Register the hostname with MDNS - name comes from config
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.registerHost = function (inCallback)
{
	throw new Error ("sensible.Application.registerHost() called - abstract")
}

/**
 * Register the service with MDNS - service info comes from config
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.registerService = function (inCallback)
{
	throw new Error ("sensible.Application.registerService() called - abstract")
}

/**
 * Save configuration - by default to sensible-config.json
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.saveConfig = function ()
{
	throw new Error ("sensible.Application.saveConfig() called - abstract")
}

/**
 * Save properties - by default to sensible-properties.json
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.saveProperties = function ()
{
	throw new Error ("sensible.Application.saveProperties() called - abstract")
}

/**
 * Start everything - MDNS advertisement and HTTP server
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.start = function (inCallback)
{
	throw new Error ("sensible.Application.start() called - abstract")
}			

/**
 * Start HTTP server
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.startHTTPServer = function (inCallback)
{
	throw new Error ("sensible.Application.startHTTPServer() called - abstract")
}

/**
 * Stop everything - MDNS advertisement and HTTP server
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.stop = function ()
{
	throw new Error ("sensible.Application.stop() called - abstract")
}

/**
 * Stop HTTP server
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */
 
sensible.Application.prototype.stopHTTPServer = function ()
{
	throw new Error ("sensible.Application.stopHTTPServer() called - abstract")
}

/**
 * Unregister the hostname with MDNS - name comes from config
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.unregisterHost = function (inCallback)
{
	throw new Error ("sensible.Application.unregisterHost() called - abstract")
}

/**
 * Unregister the service with MDNS - service info comes from config
 * Usually overridden by platform-specific Application class.
 *
 * @param {function} inCallback - function to be called on completion
 */

sensible.Application.prototype.unregisterService = function ()
{
	throw new Error ("sensible.Application.unregisterService() called - abstract")
}

// PRIVATE

// CONTROLLER ACTIONS

sensible.Application.prototype.config_get = function (inRequest, inCallback)
{
	var	response = new Object ();
	response.type = "json";
	response.object = this.config;
	
	var	name = inRequest.parameters.name;
	
	if (name && name.length)
	{
		response.object = this.config [name];

		if (! response.object)
		{
			response.type = "error";
			response.error = "config key " + name + " not found";
		}
	}
	
	inCallback (response);
}

sensible.Application.prototype.config_set = function (inRequest, inCallback)
{
	var	changed = false;
	
	for (var key in inRequest.parameters)
	{
		if (key == "name")
		{
			if (newValue && (newValue != this.config.name))
			{
				this.config.name = newValue;
				changed = true;
			}
		}
		else
		if (key == "type")
		{
			if (newValue && (newValue != this.config.type))
			{
				this.config.type = newValue;
				changed = true;
			}
		}
		else
		if (key == "port")
		{
			var	newPort = parseInt (newValue);
			
			if (isNaN (newPort))
			{
				console.log ("bad numeric value for setting port : " + inRequest.parameters [key]);
			}
			else
			{
				if (this.config.port != newPort)
				{
					this.config.port = newPort;
					changed = true;
				}
			}
		}
		else
		{
			console.log ("config_set with unknown key " + key);
		}
	}
	
	if (changed)
	{
		this.saveConfig ();
		this.stop ();
		this.start ();
	}
	
	var	response = new Object ();
	response.type = "json";
	response.object = this.config;
	
	inCallback (response);
}

sensible.Application.prototype.properties_get = function (inRequest, inCallback)
{
	var	response = new Object ();
	response.type = "json";
	response.object = this.properties;
	
	var	name = inRequest.parameters.name;
	
	if (name && name.length)
	{
		response.object = this.propertiesByKey [name];

		if (! response.object)
		{
			response.type = "error";
			response.error = "property " + name + " not found";
		}
	}
	
	inCallback (response);
}

sensible.Application.prototype.properties_set = function (inRequest, inCallback)
{
	var	changed = false;
	
	for (var key in inRequest.parameters)
	{
		// sometimes we get zero length keys, from URLs with trailing &s
		// a little bug in someone's URL parser perchance
		if (key && key.length)
		{
			var	newValue = inRequest.parameters [key];
			var	property = this.propertiesByKey [key];
			
			if (property)
			{
				var	oldValueType = typeof (property.value);
				
				if (oldValueType == "string")
				{
					if (property.value != newValue)
					{
						changed = true;
						property.value = newValue;
					}
				}
				else
				if (oldValueType == "number")
				{
					var	numberValue = parseInt (newValue);
					
					if (isNaN (numberValue))
					{
						console.log ("bad numeric value for setting " + key + ": " + newValue);
					}
					else
					{
						if (numberValue < property.minimum || numberValue > property.maximum)
						{
							console.log ("value out of range for setting " + key + ": " + numberValue);
						}
						else
						{
							if (property.value != numberValue)
							{
								changed = true;
								property.value = numberValue;
							}
						}
					}
				}
				else
				if (oldValueType == "boolean")
				{
					var	booleanValue = (newValue.toLowerCase () == "true");
					
					if (property.value != booleanValue)
					{
						changed = true;
						property.value = booleanValue;
					}
				}
				else
				{
					console.log ("unknown type for setting " + key + ": " + oldValueType);
				}
			}
			else
			{
				console.log ("properties_set with unknown key " + key);
			}
		}
	}
	
	if (changed)
	{
		this.saveProperties ();
	}
	
	var	response = new Object ();
	response.type = "json";
	response.object = this.properties;
	
	inCallback (response);
}

// STATIC DATA

sensible.Application.kFileExtensionToContentType = 
{
	"gif" : "image/gif",
	"html" : "text/html",
	"ico" : "image/x-icon",
	"jpg" : "image/jpeg",
	"png" : "image/png",
	"txt" : "text/plain"
};
sensible.provide ("sensible.Strategy");

/**
 * sensible strategy interface
 *
 * @class
 * @constructor
 */
 
sensible.Strategy = function ()
{
}

/**
 * Subscribe the UDP socket to a multicast address.
 *
 * @param {string} inMulticastAddress - multicast address to join, eg 224.0.0.251 for MDNS
 * @param {function} inCallback - function to call on completion
 */
 
sensible.Strategy.prototype.addMembership = function (inMulticastAddress, inCallback)
{
	throw new Error ("sensible.Strategy.addMembership() called - abstract");
}

/**
 * Open the UDP socket and bind to the specified port.
 * Note only one UDP socket per strategy instance.
 *
 * @param {integer} inPort - port to which to bind, eg 5353 for MDNS
 * @param {function} inCallback - function to call on completion
 */
sensible.Strategy.prototype.open = function (inPort, inCallback)
{
	throw new Error ("sensible.Strategy.open() called - abstract");
}

/**
 * Close the UDP socket and bind to the specified port.
 *
 * @param {integer} inPort - port to which to bind, eg 5353 for MDNS
 * @param {function} inCallback - function to call on completion
 */
sensible.Strategy.prototype.close = function ()
{
	throw new Error ("sensible.Strategy.close() called - abstract");
}

/**
 * Return the host name of the machine.
 *
 * @returns {string} host name
 */
sensible.Strategy.prototype.getHostName = function ()
{
	throw new Error ("sensible.Strategy.getHostName() called - abstract");
}

/**
 * Return the IP address of the machine.
 *
 * @returns {string} IP address
 */
sensible.Strategy.prototype.getIPAddress = function ()
{
	throw new Error ("sensible.Strategy.getIPAddress() called - abstract");
}

/**
 * Listen for packets on the UDP socket.
 *
 * @param {function} inCallback - function to call on reception
 */
sensible.Strategy.prototype.listen = function (inCallback)
{
	throw new Error ("sensible.Strategy.listen() called - abstract");
}

/**
 * Send a packet on the UDP socket.
 *
 * @param {ArrayBuffer} inPacket - packet
 * @param {string} inRemoteAddress - remote address
 * @param {port} inRemotePort - remote port
 */
sensible.Strategy.prototype.send = function (inPacket, inRemoteAddress, inRemotePort)
{
	throw new Error ("sensible.Strategy.send() called - abstract");
}

sensible.provide ("sensible.Util");

sensible.Util = function ()
{
}

/**
 * User friendly front-end to XMLHttpRequest
 * Essentially emulates $.ajax
 * However, it will do JSONP for you using sensible.jsonp() if necessary
 * Note that currently Firefox can't do binary types
 *
 * @param {object} inRequest - object describing the request
 * url - url of request, minus params
 * data - url params
 * type - http method - GET, POST
 * dataType - json, string, etc
 * async - true/false
 * success - function to call if request succeeds
 * error - function to call on error
 */

sensible.Util.ajax = function (inRequest)
{
	// console.log ("sensible.Util.ajax(" + inRequest.url + ")");
	
	var	type = inRequest.type && inRequest.type.length ? inRequest.type : "GET";

	// ensure we upper case for later
	// seems like something above the submit event lowercases the method :-S
	type = type.toUpperCase ();

	var	async = true;
	
	if (typeof (inRequest.async) == "boolean")
	{
		async = inRequest.async;
	}

	inRequest.dataType = inRequest.dataType.toLowerCase ();

	if (inRequest.dataType == "jsonp"
		|| (inRequest.dataType == "json" && sensible.Util.isCrossDomainRequest (inRequest.url)))
	{
		// console.log ("using jsonp for url: " + inRequest.url);
		
		sensible.Util.jsonp (inRequest);
	}
	else
	{
		var	xhr = new XMLHttpRequest ();
	
		xhr.onreadystatechange = function ()
		{
			if (this.readyState == 4)
			{
				var	textStatus = "OK";
				
				// otherwise we check EVERYWHERE
				if (!inRequest.success)
				{
					inRequest.success = function ()
					{
					}
				}

				if (!inRequest.error)
				{
					inRequest.error = function ()
					{
					}
				}
				
				if (inRequest.dataType == "blob")
				{
					if (this.response)
					{
						inRequest.success (this.response, textStatus, this);
					}
					else
					{
						textStatus = "error";
						inRequest.error (this, textStatus, "Not Found");
					}
				}
				else
				if (inRequest.dataType == "json")
				{
					// if loading off the filesystem, can"t tell the difference
					// between a file not found and an empty file
					// so if status = 0 and data is empty, call the error callback
					if ((this.responseText && this.responseText.length) || this.status == 200)
					{
						try
						{
							inRequest.success (JSON.parse (this.responseText), textStatus, this);
						}
						catch (inError)
						{
							textStatus = "parsererror";
							inRequest.error (this, textStatus, inError);
						}
					}
					else
					{
						textStatus = "error";
						inRequest.error (this, textStatus, "Not Found");
					}
				}
				else
				{
					// if loading off the filesystem, can"t tell the difference
					// between a file not found and an empty file
					// so if status = 0 and data is empty, call the error callback
					if ((this.responseText && this.responseText.length) || this.status == 200)
					{
						inRequest.success (this.responseText, textStatus, this);
					}
					else
					{
						textStatus = "error";
						inRequest.error (this, textStatus, "Not Found");
					}
				}
	
				if (typeof (inRequest.complete) == "function")
				{
					inRequest.complete (this, textStatus);
				}
			}
		}
		// the order of open(), setRequestHeader(), and send() is important
		
		var	url = inRequest.url;

		// also have to do this with GET urls
		if (type == "GET" || type == "HEAD")
		{
			if (inRequest.data && inRequest.data.length)
			{
				url += "?" + inRequest.data;
			}
		}
	
		xhr.open (type, url, async);
	
		if (inRequest.dataType == "blob")
		{
			xhr.responseType = "blob";
		}
		
		if (typeof (inRequest.headers) == "object")
		{
			for (var key in inRequest.headers)
			{
				var	value = inRequest.headers [key];
				
				if (typeof (value) != "function")
				{
					xhr.setRequestHeader (key, value);
				}
			}
		}
		
		// some browsers throw on send() instead of doing a state change, sigh
		try
		{
			if (inRequest.type == "POST")
			{
				xhr.send (data);
			}
			else
			{
				xhr.send (null);
			}
		}
		catch (inError)
		{
			if (typeof (inRequest.error) == "function")
			{
				inRequest.error (inRequest, "error", inError.name);
			}
		}
	}
}

sensible.Util.jsonpSequence = 0;

sensible.Util.jsonp = function (inRequest)
{
	var	jsonpCallbackName = "sensible_jsonp_callback_" + sensible.Util.jsonpSequence;
	sensible.Util.jsonpSequence++;
	
	var	url = inRequest.url;
	url += "?";
	
	if (inRequest.data && inRequest.data.length)
	{
		url += inRequest.data;
	}
	
	url += "&callback=" + jsonpCallbackName;
	
	var	jsonTag = document.createElement ("script");
	jsonTag.setAttribute ("type", "text/javascript");
	jsonTag.setAttribute ("src", url);
	
	jsonTag.onload = function ()
	{
		// i hear that setTimeout()ing this is safer...
		setTimeout
		(
			function ()
			{
				window [jsonpCallbackName] = null;
				document.querySelector ("head").removeChild (jsonTag);
			},
			1
		);
	}
	
	document.querySelector ("head").appendChild (jsonTag);
	
	window [jsonpCallbackName] = function (inJSONObject)
	{
		if (inJSONObject)
		{
			if (typeof (inRequest.success) == "function")
			{
				inRequest.success (inJSONObject, "OK", null);
			}
		}
		else
		{
			if (typeof (inRequest.error) == "function")
			{
				inRequest.error (null, "ERROR", null);
			}
		}
	}
}

/**
 * Decides whether a request for a URL is cross-domain or not.
 *
 * @param {string} inURL - URL of request
 */

sensible.Util.isCrossDomainRequest = function (inURL)
{
	var	here = document.createElement ("a");
	here.href = document.location.href.toLowerCase ();
	
	var	there = document.createElement ("a");
	there.href = inURL.toLowerCase ();
	
	// host includes the port, if any
	return here.protocol != there.protocol || here.host != there.host;
}

sensible.Util.kExtensionToContentType = 
{
	"css" : "text/css",
	"gif" : "image/gif",
	"htm" : "text/html",
	"html" : "text/html",
	"jpg" : "image/jpeg",
	"jpeg" : "image/jpeg",
	"json" : "application/json",
	"js" : "application/javascript",
	"mp3" : "audio/mpeg3",
	"mpg" : "video/mpeg",
	"png" : "image/png",
	"rtf" : "application/rtf",
	"xml" : "application/xml"
};

// pass any string in here
sensible.Util.mapExtensionToContentType = function (inString)
{
	// console.log ("Util.mapExtensionToContentType(" + inString + ")");
	
	var	extension = inString;
	var	periodIndex = inString.lastIndexOf (".");
	
	if (periodIndex >= 0)
	{
		extension = inString.substring (periodIndex + 1);
	}
	
	extension = extension.toLowerCase ();

	var	contentType = sensible.Util.kExtensionToContentType [extension];
	
	if (!contentType)
	{
		console.error ("no content type for extension (" + extension + ")");
		contentType = "application/octet-stream";
	}
	
	return contentType;
}
/**
 * @file node-server.js
 * @copyright Monohm 2014
 */

sensible.provide ("sensible.node.Server");

/**
 * Web and Websockets REST server for node.
 * Listens for HTTP and WS requests and dispatches to REST handlers or files.
 *
 * @class
 * @constructor
 * @param {integer} inPort - port number on which to listen
 * @param {object} inDelegate - delegate to resolve REST requests
 */

sensible.node.Server = function (inPort, inDelegate)
{
	this.delegate = inDelegate;
	
	this.httpServer = new sensible.node.WebServer (this.onHTTPRequest.bind (this));
	
	// some ports can't do web sockets, eg Tessel
	if (websocket)
	{
		this.webSocketServer = new websocket.server
		({
			httpServer: this.httpServer.server,
			autoAcceptConnections: false
		});
		
		console.log ("WebSocket server listening");
		
		var	self = this;
		
		this.webSocketServer.on
		(
			"request",
			function (inRequest)
			{
				var	webSocket = inRequest.accept ("sensible-protocol", inRequest.origin);
	
				webSocket.on
				(
					"message",
					function (inMessage)
					{
						self.delegate.onWebSocketOpen (webSocket);
	
						if (inMessage.type == "utf8")
						{
							self.onWSMessage (inMessage.utf8Data, webSocket);
						}
						else
						if (inMessage.type == "binary")
						{
							console.log ("binary websockets message received (ignored)");
						}
					}
				);
	
				webSocket.on
				(
					"close",
					function ()
					{
						self.delegate.onWebSocketClose (webSocket);
					}
				);
			}
		);
	}
	else
	{
		console.error ("websocket undefined, disabling web socket server");
	}

	this.httpServer.listen (inPort);
}

/**
 * Stop serving requests.
 */

sensible.node.Server.prototype.stop = function ()
{
	this.httpServer.stop ();
}

/**
 * Called on receipt of an HTTP request.
 * Calls the REST dispatcher to try and resolve the request against our delegate.
 * If the resolution succeeds, the handler is called and the response assumed to be JSON.
 * If the resolution fails, we attempt to serve a file with the appropriate path.
 *
 * @param {object} inRequest - HTTP request
 * @param {object} outResponse - HTTP response
 * @param {object} inRequestURL - parsed URL
 * @param {object} inRequestParams - parsed request parameters
 */

sensible.node.Server.prototype.onHTTPRequest = function (inRequest, outResponse, inRequestURL, inRequestParams)
{
	console.log (inRequest.socket.remoteAddress + ":" + inRequest.socket.remotePort + ":" + inRequest.url);

	try
	{
		// map the node request to a regular parsed-anchor one
		var	request = 
		{
			method: inRequest.method,
			url:
			{
				pathname: inRequestURL.pathname,
				search: inRequestURL.search ? inRequestURL.search.replace ("?", "") : "",
				hash: inRequestURL.hash ? inRequestURL.hash.replace ("#", "") : ""
			},
			parameters: inRequestParams
		};
		
		var	self = this;
		
		sensible.RESTDispatcher.dispatchRequest
		(
			request, this.delegate,
			function (inResponse)
			{
				if (inResponse.type == "json")
				{
					var	json = JSON.stringify (inResponse.object);
					
					var	jsonpCallback = inRequestParams.callback;
					
					if (jsonpCallback && jsonpCallback.length)
					{
						json = jsonpCallback + "(" + json + ")";
					}
					
					outResponse.writeHead
					(
						200,
						{
							"Content-Type" : "application/json",
							"Content-Length" : json.length
						}
					);
					
					outResponse.write (json);
				}
				else
				if (inResponse.type == "file")
				{
					// we satisfy all file references off the web root
					var	path = "web/" + inResponse.path;
					
					self.sendFile (path, outResponse);
				}
				else
				if (inResponse.type == "error")
				{
					console.log ("error running controller");
					console.log (inResponse.error);
					
					outResponse.writeHead
					(
						500,
						inResponse.error,
						{
						}
					);
						
					outResponse.end ();	
				}
				else
				{
					console.error ("sensible.node.Server can't deal with response type " + inResponse.type);
				}
			}
		);

	}
	catch (inError)
	{
		console.log ("error processing " + inRequest.url);
		console.log (inError.message);

		outResponse.writeHead
		(
			500,
			{
			},
			inError.message
		);
	}
	
	outResponse.end ();
}

/**
 * Called on receipt of a WebSockets message.
 * Calls the REST dispatcher to try and resolve the request against our delegate.
 * If the resolution succeeds, the handler is called and the response assumed to be JSON.
 * If the resolution fails, we attempt to serve a file with the appropriate path.
 *
 * @param {object} inMessage - WebSockets message
 * @param {object} inWebSocket - the WebSocket on which the message arrived
 */

sensible.node.Server.prototype.onWSMessage = function (inMessage, inWebSocket)
{
	var	responseObject = null;
	var	error = null;
	var	message = JSON.parse (inMessage);
	
	console.log ("onWSMessage()");
	console.log (inMessage);
	
	// some of the handlers need to know we're on WS instead of HTTP
	message.webSocket = inWebSocket;
	
	try
	{
		var	response = sensible.RESTDispatcher.dispatchMessage (message, this.delegate);

		if (response.object)
		{
			var	packet = 
			{
				controller: message.controller,
				action: message.action,
				data: response.object
			};
			
			inWebSocket.sendUTF (JSON.stringify (packet));
		}
	}
	catch (inError)
	{
		console.log ("error processing message " + inMessage.controller + "/" + inMessage.action);
		console.log (inError.message);
	}
}

/**
 * Send a file with the specified pathname to the specified response.
 * Called when REST dispatch fails. If the file cannot be found or another
 * error occurs, a 404 file not found response is sent.
 *
 * @param {string} inPathName - path of file
 * @param {object} outResponse - HTTP response
 */

sensible.node.Server.prototype.sendFile = function (inPathName, outResponse)
{
	console.log ("sensible.node.Server.sendFile(" + inPathName + ")");
	
	var	file = null;
	
	try
	{
		file = fs.readFileSync (inPathName);
		
		outResponse.writeHead
		(
			200,
			{
				"Content-Type" : mime.lookup (inPathName),
				"Content-Length" : file.length
			}
		);
		
		outResponse.write (file);
	}
	catch (inError)
	{
		console.log (inError.message);
		outResponse.writeHead (404, "File Not Found");
	}
}

/**
 * @file node-web-server.js
 * @copyright Monohm 2014
 */

/**
 * Web server for node.
 * Implements support for POST on top of the regular incoming-request class.
 *
 * @class
 * @constructor
 * @param {function} inRequestListener - function to call with request when complete
 */

sensible.node.WebServer = function (inRequestListener)
{
	this.requestListener = inRequestListener;

	if (gSensibleApplication.config.ssl)
	{
		var	sslConfig = gSensibleApplication.config.ssl;
		
		console.log ("reading certificate from " + sslConfig.certificate_path);
		var	certificate = fs.readFileSync (sslConfig.certificate_path);

		console.log ("reading private key from " + sslConfig.private_key_path);
		var	privateKey = fs.readFileSync (sslConfig.private_key_path);

		var	caCertificates = new Array ();
		
		for (var i = 0; i < sslConfig.ca_certificate_paths.length; i++)
		{
			console.log ("reading CA certificate from " + sslConfig.ca_certificate_paths [i]);
			caCertificates [i] = fs.readFileSync (sslConfig.ca_certificate_paths [i]);
		}
		
		// HACK won't work on tessel
		var	sslOptions =
		{
			cert: certificate,
			key: privateKey,
			ca: caCertificates
		};
		
		this.server = https.createServer (sslOptions, this.onRequest.bind (this));
	}
	else
	{
		this.server = http.createServer (this.onRequest.bind (this));
	}
}

/**
 * Stop serving requests.
 */

sensible.node.WebServer.prototype.stop =
function NodeWebServer_stop ()
{
	this.server.close ();
}

/**
 * Listen for requests.
 *
 * @param {integer} inPort - port on which to listen, eg 80 for HTTP
 */

sensible.node.WebServer.prototype.listen =
function NodeWebServer_listen (inPort)
{
	this.server.listen (inPort);
}

/**
 * Dispatch event handler assignments.
 * This class stands in for the regular server class, so we have to proxy
 * the setting of various event handlers.
 * Check for setting the request event handler, as we will call that
 * when WE think the request is complete, ie once we've checked for POST, etc.
 * Forward on any other event handler assignments to our server instance.
 *
 * @param {string} inEventName - name of event, eg request
 * @param {function} inEventHandler - event handler function
 */

sensible.node.WebServer.prototype.on =
function NodeWebServer_on (inEventName, inEventHandler)
{
	var	handled = false;
	
	if (inEventName == "request")
	{
		this.requestListener = inEventHandler;
		handled = true;
	}
	
	if (!handled)
	{
		this.server.on (inEventName, inEventHandler);
	}
}

// event handlers

/**
 * Handle incoming HTTP requests.
 * This implementation extends the regular Node http package
 * by supporting POST.
 *
 * @param {object} inRequest - HTTP request
 * @param {object} outResponse - HTTP response
 */

sensible.node.WebServer.prototype.onRequest =
function NodeWebServer_onRequest (inRequest, outResponse)
{
	if (inRequest.method.toLowerCase () == "post")
	{
		var	body = "";
		
		var	self = this;
		
		inRequest.on
		(
			"data",
			function (inData)
			{
				body += inData;
			}
		);
		
		inRequest.on
		(
			"end",
			function (inData)
			{
				var	params = new Object ();
				
				var	paramElements = body.split ("&");
				
				for (var i = 0; i < paramElements.length; i++)
				{
					var	elements = paramElements [i].split ("=");
					
					if (elements.length > 1)
					{
						var	key = elements [0];
						var	value = decodeURIComponent (elements [1]);
						
						params [key] = value;
					}
				}
				
				if (self.requestListener)
				{
					var	requestURL = url.parse (inRequest.url, true, true);
					self.requestListener (inRequest, outResponse, requestURL, params);
				}
			}
		);
	}
	else
	{
		if (this.requestListener)
		{
			var	requestURL = url.parse (inRequest.url, true, true);
			this.requestListener (inRequest, outResponse, requestURL, requestURL.query);
		}
	}
}

/**
 * @file NodeApplication
 * @copyright Monohm, Inc. 2014
 */

sensible.provide ("sensible.node.Application");

sensible.node.Application = function (inCallback)
{
	sensible.Application.call (this, inCallback);
}
sensible.inherits (sensible.node.Application, sensible.Application);

// SENSIBLE_APPLICATION IMPLEMENTATION

// override to load the config from the hardware
// we assume the load() is async for safety reasons!
sensible.node.Application.prototype.loadConfig = function (inCallback)
{
	var	self = this;
	
	fs.readFile
	(
		"sensible-config.json",
		function (inError, inContents)
		{
			var	error = inError;
			
			if (inContents)
			{
				try
				{
					self.config = JSON.parse (inContents);
				}
				catch (inError)
				{
					error = inError;
				}
			}
			
			if (inCallback)
			{
				inCallback (error);
			}
		}
	);
}

sensible.node.Application.prototype.loadProperties = function (inCallback)
{
	var	self = this;
	
	fs.readFile
	(
		"sensible-properties.json",
		function (inError, inContents)
		{
			var	error = inError;
			
			if (inContents)
			{
				try
				{
					self.properties = JSON.parse (inContents);
			
					self.propertiesByKey = new Object ();
					
					// sort the property key cache
					for (var i = 0; i < self.properties.length; i++)
					{
						var	property = self.properties [i];
						self.propertiesByKey [property.name] = property;
					}
				}
				catch (inError)
				{
					error = inError;
				}
			}
			
			if (inCallback)
			{
				inCallback (error);
			}
		}
	);
}

sensible.node.Application.prototype.registerHost =
function node_Application_registerHost (inCallback)
{
	console.log ("node.Application.registerHost()");
	
	if (this.config.hostname)
	{
		this.mdns.registerHost (this.config.hostname, null);
	}

	if (inCallback)
	{
		inCallback ();
	}
}

sensible.node.Application.prototype.registerService = function (inCallback)
{
	var	service = this.mdns.registerService
		(this.config.name, this.config.type, null, this.config.port, this.config.description, this.config.ttl);

	console.log ("server advertised as "
		+ service.name + "." + service.type + ":" + service.host + ":" + service.port);

	if (inCallback)
	{
		inCallback ();
	}
}

// override to save config to the hardware
// this will be hopefully the same structure as retrieved using loadConfig()
sensible.node.Application.prototype.saveConfig = function ()
{
	try
	{
		// prettyprint the JSON to the file
		var	config = JSON.stringify (this.config, {}, 2);
		fs.writeFileSync ("sensible-config.json", json);
	}
	catch (inError)
	{
		console.error ("unable to write sensible-config.json");
		console.error (inError);
	}
}

// override to save properties to the hardware
// this will be hopefully the same structure as retrieved using loadProperties()
sensible.node.Application.prototype.saveProperties = function ()
{
	try
	{
		// prettyprint the JSON to the file
		var	json = JSON.stringify (this.properties, {}, 2);
		fs.writeFileSync ("sensible-properties.json", json);
	}
	catch (inError)
	{
		console.error ("unable to write sensible-properties.json");
		console.error (inError);
	}
}

sensible.node.Application.prototype.start =
function node_Application_start (inCallback)
{
	this.startHTTPServer ();
	
	this.mdns = new sensible.MDNS ();

	var	self = this;
	
	this.mdns.start
	(
		function (inError)
		{
			if (inError)
			{
				inCallback.call (self, inError);
			}
			else
			{
				self.registerService
				(
					function ()
					{
						self.registerHost
						(
							function ()
							{
								inCallback.call (self);
							}
						);
					}
				);
			}
		}
	);
}


sensible.node.Application.prototype.startHTTPServer = function (inCallback)
{
	this.server = new sensible.node.Server (this.config.port, this);
	
	if (inCallback)
	{
		inCallback ();
	}
}

sensible.node.Application.prototype.stop =
function node_Application_stop ()
{
	this.unregisterService ();
	this.stopHTTPServer ();
}

sensible.node.Application.prototype.stopHTTPServer = function ()
{
	this.server.stop ();
}

sensible.node.Application.prototype.unregisterHost = function ()
{
	if (this.config.hostname)
	{
		this.mdns.unregisterHost (this.config.hostname);
	}
}

sensible.node.Application.prototype.unregisterService = function ()
{
	this.mdns.unregisterService (null, this.config.port);
}

sensible.node.Application.prototype.onWebSocketOpen = function ()
{
}

sensible.node.Application.prototype.onWebSocketClose = function ()
{
}
/**
 * @file NodeStrategy
 * @copyright Monohm, Inc. 2014
 */

sensible.provide ("sensible.node.Strategy");

/**
 * Implementation of Strategy for the Node platform.
 *
 * @class sensible.node.Strategy
 */
 
sensible.node.Strategy = function ()
{
	sensible.Strategy.call (this);
}
sensible.inherits (sensible.node.Strategy, sensible.Strategy);

/**
 * Subscribe the UDP socket to a multicast address.
 *
 * @param {string} inMulticastAddress - multicast address to join, eg 224.0.0.251 for MDNS
 * @param {function} inCallback - function to call on completion
 */

sensible.node.Strategy.prototype.addMembership = function (inMulticastAddress, inCallback)
{
	this.socket.addMembership ("224.0.0.251");
	
	if (inCallback)
	{
		inCallback ();
	}
}

/**
 * Open the UDP socket and bind to the specified port.
 * Note only one UDP socket per strategy instance.
 *
 * @param {integer} inPort - port to which to bind, eg 5353 for MDNS
 * @param {function} inCallback - function to call on completion
 */
sensible.node.Strategy.prototype.open = function (inPort, inCallback)
{
	// console.log ("sensible.node.Strategy.open(" + inPort + ")");
	
	this.socket = dgram.createSocket ("udp4");

	// note that later nodes require the address parameter
	this.socket.bind
	(
		inPort,
		"0.0.0.0",
		function (inError)
		{
			inCallback (inError);
		}
	);
}

/**
 * Close the UDP socket and bind to the specified port.
 *
 * @param {integer} inPort - port to which to bind, eg 5353 for MDNS
 * @param {function} inCallback - function to call on completion
 */
sensible.node.Strategy.prototype.close = function ()
{
	this.socket.close ();
}

/**
 * Return the host name of the machine.
 *
 * @returns {string} host name
 */
sensible.node.Strategy.prototype.getHostName = function ()
{
	return os.hostname ();
}

/**
 * Return the IP address of the machine.
 *
 * @returns {string} IP address
 */
sensible.node.Strategy.prototype.getIPAddress = function ()
{
	var	address = null;
	
	var	interfaces = os.networkInterfaces ();
	
	for (var name in interfaces)
	{
		var	addresses = interfaces [name];
		
		for (var i = 0; i < addresses.length; i++)
		{
			var	address = addresses [i];
			
			if (! address.internal)
			{
				if (address.family.toLowerCase () == "ipv4")
				{
					// should probably check for dups here, but how would we?
					address = address.address;

					break;
				}
			}
		}
		
		if (address && address.length)
		{
			break;
		}
	}

	if (address == null || address.length == 0)
	{
		address = "127.0.0.1";
	}

	return address;
}

/**
 * Listen for packets on the UDP socket.
 *
 * @param {function} inCallback - function to call on reception
 */
sensible.node.Strategy.prototype.listen = function (inCallback)
{
	this.socket.on
	(
		"message",
		function (inMessage, inRemoteInfo)
		{
			// convert to arraybuffer for the rest of the world
			var	buffer = new ArrayBuffer (inMessage.length);
			var	view = new Uint8Array (buffer);
			
			for (var i = 0; i < inMessage.length; i++)
			{
				view [i] = inMessage [i];
			}
	
			inCallback (buffer, inRemoteInfo.address, inRemoteInfo.port);
		}
	);
}

/**
 * Send a packet on the UDP socket.
 *
 * @param {ArrayBuffer} inPacket - packet
 * @param {string} inRemoteAddress - remote address
 * @param {port} inRemotePort - remote port
 */
sensible.node.Strategy.prototype.send = function (inPacket, inRemoteAddress, inRemotePort)
{
	var	view = new Uint8Array (inPacket);

	var	buffer = new Buffer (inPacket.byteLength);
	
	for (var i = 0; i < inPacket.byteLength; i++)
	{
		buffer.writeUInt8 (view [i], i);
	}

	this.socket.send
	(
		buffer, 0, buffer.length, inRemotePort, inRemoteAddress,
		function (inError, inBytes)
		{
			if (inError)
			{
				console.log ("error sending request");
				console.log (inError);
			}
		}
	);
}

sensible.provide ("sensible.fxos.SocketPump");

sensible.fxos.SocketPump = function (inSocket, inBlob)
{
	this.socket = inSocket;
	this.blob = inBlob;
	this.start = 0;
	this.finished = false;
	this.blockSize = 32 * 1024;

	// due to a bug, ondrain() is not called on server sockets
	// SIGH
	// so we futureproof by not calling our hack if ondrain() is called
	this.drainHack = true;
	this.drainHackInterval = 100;
	
	console.log ("block size is " + this.blockSize);
	console.log ("drain hack interval is " + this.drainHackInterval);

	var	self = this;
	
	this.socket.ondrain = function ()
	{
		console.log ("socket ondrain fires! (this never happens)");
		self.drainHack = false;
		self.send ();
	}

	// don't install an error handler
	// we assume you have an error handler
	// which closes the socket
	// we check the socket's ready state before sending
}

sensible.fxos.SocketPump.prototype.pump = function ()
{
	this.send ();
}

// PRIVATE

sensible.fxos.SocketPump.prototype.send = function ()
{
	if (this.finished)
	{
		console.log ("finished went high, stopping pump");
		
		// if we already sent the last blob
		// just close the socket
		this.socket.close ();
	}
	else
	{
		var	end = 0;
		
		if (this.start + this.blockSize > this.blob.size)
		{
			end = this.blob.size;
			this.finished = true;
		}
		else
		{
			end = this.start + this.blockSize;
		}
		
		// console.log ("socket pump sending slice " + this.start + " to " + end);
		
		var	slice = this.blob.slice (this.start, end);
		this.start = end;
		
		var	self = this;
		var	reader = new FileReader ();
		
		reader.onloadend = function ()
		{
			var	sent = false;
			
			try
			{
				sent = self.socket.send (reader.result, 0, reader.result.byteLength);
			}
			catch (inError)
			{
				// this can happen during seeking, etc
				// it's largely a symptom of our ondrain() hack
				
				// console.error ("send() throws");
				// console.error (inError);
			}
			
			if (sent)
			{
				self.send ();
			}
			else
			{
				// so either send on timeout
				// or wait for ondrain()
				// depending on whether the bug has been fixed
				if (self.socket.readyState == "open")
				{
					if (self.drainHack)
					{
						setTimeout
						(
							function ()
							{
								self.send ();
							},
							self.drainHackInterval
						);
					}
				}
				else
				{
					console.error ("socket went to " + self.socket.readyState + " state, pump stopping");
					self.finished = true;
				}
			}
		}
		
		reader.readAsArrayBuffer (slice);
	}
}

sensible.provide ("sensible.fxos.Server");

sensible.fxos.Server = function (inPort, inDelegate)
{
	console.log ("sensible.fxos.Server listening on port " + inPort);
	
	var	self = this;
	
	// we have to go with the arraybuffer type
	// otherwise we can't deliver binaries
	// but i'm unclear why i have to CARE
	// when the underlying Unix socket does NOT care
	this.serverSocket = navigator.mozTCPSocket.listen (inPort, {binaryType: "arraybuffer"}, 10);
	
	this.serverSocket.onconnect = function (inConnectedSocket)
	{
		var	server = new sensible.fxos.WebServer
		(
			inConnectedSocket,
			function (inRequest)
			{
				self.onRequest (inConnectedSocket, inRequest, inDelegate);
			}
		);
	}
}

// return an object describing the range spec of the request, if any
// ASSUME that the response is of type blob and has a blob in the "object" property
sensible.fxos.Server.prototype.getRangeSpec = function (inRequest, outResponse)
{
	var	spec = new Object ();
	spec.isRange = false;
	spec.blob = outResponse.object;
	spec.size = outResponse.object.size;
	
	// note, the sensible web server lowercases all headers
	var	rangeHeader = inRequest.headers ["range"];
	
	if (rangeHeader)
	{
		spec.isRange = true;
		
		var	rangeHeaderElements = rangeHeader.split ("=");
		
		if (rangeHeaderElements [0] == "bytes")
		{
			var	rangeElements = rangeHeaderElements [1].split ("-");
			spec.start = parseInt (rangeElements [0]);
			
			if (rangeElements [1] && rangeElements [1].length)
			{
				spec.end = parseInt (rangeElements [1]);
			}
			else
			{
				spec.end = spec.size;
			}
			
			spec.blob = outResponse.object.slice (spec.start, spec.end);
		}
		else
		{
			console.error ("range type " + rangeHeaderElements [1] + " not supported");
		}
	}
	
	return spec;
}

// this is just pure javascript gold
// anyone any idea what encoding anyone should use?
sensible.fxos.Server.prototype.sendString = function (inSocket, inString)
{
	// console.log ("Server.sendString(" + inString + ")");
	
	var	buffer = new ArrayBuffer (inString.length);
	var	view = new Uint8Array (buffer);
	
	for (var i = 0; i < inString.length; i++)
	{
		view [i] = inString.charCodeAt (i);
	}
	
	return inSocket.send (buffer, 0, buffer.byteLength);
}

sensible.fxos.Server.prototype.stop = function ()
{
	if (this.serverSocket)
	{
		this.serverSocket.close ();
	}
}

sensible.fxos.Server.prototype.onRequest = function (inConnectedSocket, inRequest, inDelegate)
{
	var	self = this;
	
	try
	{
		sensible.RESTDispatcher.dispatchRequest
		(
			inRequest,
			inDelegate,
			function (inResponse)
			{
				if (inResponse.type == "json")
				{
					var	json = JSON.stringify (inResponse.object);

					var	jsonpCallback = inRequest.parameters.callback;
					
					if (jsonpCallback && jsonpCallback.length)
					{
						json = jsonpCallback + "(" + json + ")";
					}
					
					// console.log ("sending json response of length " + json.length);

					try
					{
						self.sendString (inConnectedSocket, "HTTP/1.0 200 OK\n");
						self.sendString (inConnectedSocket, "Content-Type: application/json\n");
						self.sendString (inConnectedSocket, "Content-Length: " + json.length + "\n");
						self.sendString (inConnectedSocket, "\n");
						
						var	sent = self.sendString (inConnectedSocket, json);
						// console.log ("send() returns " + sent);
					}
					catch (inError)
					{
						console.error ("error while sending json");
						console.error (inError);
					}

					inConnectedSocket.close ();
				}
				else
				if (inResponse.type == "file")
				{
					// we satisfy all file references off the web root
					var	path = "web/" + inResponse.path;
					
					sensible.Util.ajax
					({
						url: path,
						data: null,
						async: true,
						dataType: "blob",
						success: function (inData, inTextStatus, inXHR)
						{
							var	reader = new FileReader ();
							
							// reader.result is the typed array
							reader.onloadend = function ()
							{
								var	contentType = sensible.Util.mapExtensionToContentType (inResponse.path);

								try
								{
									self.sendString (inConnectedSocket, "HTTP/1.0 200 OK\n");
									self.sendString (inConnectedSocket, "Content-Type: " + contentType + "\n");
									self.sendString (inConnectedSocket, "Content-Length: " + reader.result.byteLength + "\n");
									self.sendString (inConnectedSocket, "\n");
		
									console.log ("sending file of length " + reader.result.byteLength);
									var	sent = inConnectedSocket.send (reader.result, 0, reader.result.byteLength);
								}
								catch (inError)
								{
									console.error ("error while sending file");
									console.error (inError);
								}
								
								inConnectedSocket.close ();
							}
							
							reader.onerror = function ()
							{
								console.log ("error getting file: " + inResponse.path);
	
								self.sendString (inConnectedSocket, "HTTP/1.0 404 File Not Found\n");
								self.sendString (inConnectedSocket, "Connection: close\n");
								self.sendString (inConnectedSocket, "\n");
								
								inConnectedSocket.close ();
							}
							
							reader.readAsArrayBuffer (inData);
						},
						error: function (inXHR, inTextStatus)
						{
							console.log ("error getting file: " + inResponse.path);

							self.sendString (inConnectedSocket, "HTTP/1.0 404 File Not Found\n");
							self.sendString (inConnectedSocket, "Connection: close\n");
							self.sendString (inConnectedSocket, "\n");
							
							inConnectedSocket.close ();
						}
					});
				}
				else
				if (inResponse.type == "blob")
				{
					var	contentType = null;
					
					if (inResponse.contentType)
					{
						contentType = inResponse.contentType;
					}
					else
					{
						contentType = "application/octet-stream";
					}
					
					var	rangeSpec = self.getRangeSpec (inRequest, inResponse);
					
					if (rangeSpec.isRange)
					{
						self.sendString (inConnectedSocket, "HTTP/1.0 206 Partial Content\n");
						self.sendString (inConnectedSocket, "Content-Type: " + contentType + "\n");
						self.sendString (inConnectedSocket, "Content-Length: " + rangeSpec.size + "\n");
						self.sendString (inConnectedSocket, "Accept-Range: bytes\n");
						self.sendString (inConnectedSocket,
							"Content-Range: bytes " + rangeSpec.offset + "-" + rangeSpec.limit + "/" + rangeSpec.size + "\n");
						self.sendString (inConnectedSocket, "\n");
					}
					else
					{
						self.sendString (inConnectedSocket, "HTTP/1.0 200 OK\n");
						self.sendString (inConnectedSocket, "Content-Type: " + contentType + "\n");
						self.sendString (inConnectedSocket, "Content-Length: " + rangeSpec.size + "\n");
						self.sendString (inConnectedSocket, "\n");
					}
					
					try
					{
						// ok i just wanted to type pump.pump()
						var	pump = new sensible.fxos.SocketPump (inConnectedSocket, rangeSpec.blob);
						pump.pump ();
					}
					catch (inError)
					{
						console.error ("error starting pump");
						console.error (inError);
					}
				}
				else
				if (inResponse.type == "error")
				{
					self.sendString (inConnectedSocket, "HTTP/1.0 500 " + inResponse.error + "\n");
					self.sendString (inConnectedSocket, "Connection: close\n");
					self.sendString (inConnectedSocket, "\n");
				
					inConnectedSocket.close ();
				}
				else
				{
					console.error ("sensible.fxos.Server can't deal with response type " + inResponse.type);

					self.sendString (inConnectedSocket, "HTTP/1.0 500 Bad Response Type\n");
					self.sendString (inConnectedSocket, "Connection: close\n");
					self.sendString (inConnectedSocket, "\n");
				
					inConnectedSocket.close ();
				}
			}
		);

	}
	catch (inError)
	{
		console.error (inError);

		self.sendString (inConnectedSocket, "HTTP/1.0 500 " + inError.message + "\n");
		self.sendString (inConnectedSocket, "Connection: close\n");
		self.sendString (inConnectedSocket, "\n");

		inConnectedSocket.close ();
	}
}


// Fxos Web Server - we do POST etc too

sensible.provide ("sensible.fxos.WebServer");

// assumes that inSocket comes from the onconnect() handler of a server TCP socket

sensible.fxos.WebServer = function (inSocket, inCallback)
{
	this.socket = inSocket;
	
	// this is the meat of the server
	// it calls back when a request has been fully parsed
	this.server = new sensible.WebServer (inCallback);
	
	var	self = this;
	
	this.socket.ondata = function (inEvent)
	{
		if (typeof (inEvent.data) == "string")
		{
			self.server.onReadString (inEvent.data);
		}
		else
		if (typeof (inEvent.data) == "object")
		{
			self.server.onReadBuffer (inEvent.data);
		}
		else
		{
			console.error ("onData() called with unrecognisable data type");
		}
	}
	
	this.socket.onerror = function (inError)
	{
		console.log ("sensible.fxos.WebServer.socket.onerror called");
		console.log (inError);
		
		self.socket.ondata = null;
		self.socket.close ();
	}
}

// Fxos specific Sensible application

sensible.provide ("sensible.fxos.Application");

sensible.fxos.Application = function (inCallback)
{
	sensible.Application.call (this, inCallback);
}
sensible.inherits (sensible.fxos.Application, sensible.Application);

// SENSIBLE APPLICATION IMPLEMENTATION

sensible.fxos.Application.prototype.loadConfig = function (inCallback)
{
	console.log ("sensible.fxos.Application.loadConfig()");

	if (this.config)
	{
		alert ("hey! we already loaded config!");
	}
	
	var	self = this;

	sensible.Util.ajax
	({
		url: "sensible-config.json",
		data: null,
		async: true,
		dataType: "json",
		success: function (inData, inTextStatus, inXHR)
		{
			self.config = inData;

			for (var key in self.config)
			{
				console.log ("sensible config: " + key + " = " + self.config [key]);
			}
			
			inCallback ();
		},
		error: function (inXHR, inTextStatus)
		{
			inCallback (new Error ("loadConfig can not get sensible-config.json"));
		}
	});
}

sensible.fxos.Application.prototype.loadProperties = function (inCallback)
{
	console.log ("sensible.fxos.Application.loadProperties()");

	var	self = this;

	sensible.Util.ajax
	({
		url: "sensible-properties.json",
		data: null,
		async: true,
		dataType: "json",
		success: function (inData, inTextStatus, inXHR)
		{
			self.properties = inData;

			self.propertiesByKey = new Object ();
			
			// sort the property key cache
			for (var i = 0; i < self.properties.length; i++)
			{
				var	property = self.properties [i];

				console.log ("found sensible property " + property.name);
				self.propertiesByKey [property.name] = property;
			}

			inCallback ();
		},
		error: function (inXHR, inTextStatus)
		{
			inCallback (new Error ("loadProperties can not get sensible-properties.json"));
		}
	});
}

sensible.fxos.Application.prototype.saveConfig = function (inConfig)
{
	// TODO write config to /sdcard/$sensible.configfilename 
}

sensible.fxos.Application.prototype.saveProperties = function (inProperties)
{
	// TODO write config to /sdcard/$sensible.propertiesfilename 
}

sensible.fxos.Application.prototype.registerHost =
function fxos_Application_registerHost (inCallback)
{
	console.log ("fxos.Application.registerHost()");
	
	if (this.config.hostname)
	{
		this.mdns.registerHost (this.config.hostname, null);
	}

	if (inCallback)
	{
		inCallback ();
	}
}

sensible.fxos.Application.prototype.registerService =
function fxos_Application_registerService (inCallback)
{
	var	service = this.mdns.registerService
		(this.config.name, this.config.type, null, this.config.port, this.config.description, this.config.ttl);

	console.log ("server advertised as "
		+ service.name + "." + service.type + ":" + service.host + ":" + service.port);

	if (inCallback)
	{
		inCallback ();
	}
}

sensible.fxos.Application.prototype.start =
function fxos_Application_start (inCallback)
{
	this.startHTTPServer ();
	
	this.mdns = new sensible.MDNS ();

	var	self = this;
	
	this.mdns.start
	(
		function (inError)
		{
			if (inError)
			{
				inCallback.call (self, inError);
			}
			else
			{
				self.registerService
				(
					function ()
					{
						self.registerHost
						(
							function ()
							{
								inCallback.call (self);
							}
						);
					}
				);
			}
		}
	);
}

sensible.fxos.Application.prototype.startHTTPServer =
function fxos_Application_startHTTPServer (inCallback)
{
	this.server = new sensible.fxos.Server (this.config.port, this);

	if (inCallback)
	{
		inCallback ();
	}
}

sensible.fxos.Application.prototype.stop =
function fxos_Application_stop ()
{
	this.unregisterService ();
	this.stopHTTPServer ();
}


sensible.fxos.Application.prototype.stopHTTPServer =
function fxos_Application_stopHTTPServer ()
{
	if (this.server)
	{
		this.server.stop ();
		this.server = null;
	}
}

sensible.fxos.Application.prototype.unregisterHost =
function fxos_Application_unregisterHost ()
{
	if (this.config.hostname)
	{
		this.mdns.unregisterHost (this.config.hostname);
	}
}

sensible.fxos.Application.prototype.unregisterService =
function fxos_Application_unregisterService ()
{
	this.mdns.unregisterService (null, this.config.port);
}

/**
 * @file sensible.fxos.Strategy
 * @copyright Monohm, Inc. 2014
 */

sensible.provide ("sensible.fxos.Strategy");

/**
 * Implementation of Strategy for Firefox OS.
 *
 * @class
 * @constructor
 */
 
sensible.fxos.Strategy = function ()
{
	sensible.Strategy.call (this);
}
sensible.inherits (sensible.fxos.Strategy, sensible.Strategy);

/**
 * Subscribe the UDP socket to a multicast address.
 *
 * @param {string} inMulticastAddress - multicast address to join, eg 224.0.0.251 for MDNS
 * @param {function} inCallback - function to call on completion
 */
 
sensible.fxos.Strategy.prototype.addMembership = function (inMulticastAddress, inCallback)
{
	this.socket.joinMulticastGroup (inMulticastAddress);
	
	if (inCallback)
	{
		inCallback ();
	}
}

/**
 * Open the UDP socket and bind to the specified port.
 * Note only one UDP socket per strategy instance.
 *
 * @param {integer} inPort - port to which to bind, eg 5353 for MDNS
 * @param {function} inCallback - function to call on completion
 */
sensible.fxos.Strategy.prototype.open = function (inPort, inCallback)
{
	console.log ("sensible.fxos.Strategy.open(" + inPort + ")");

	try
	{
		this.socket = new UDPSocket
		({
			addressReuse: true,
			binaryType: "arraybuffer",
			localPort: inPort
		});

		if (inCallback)
		{
			this.socket.opened.then
			(
				function ()
				{
					inCallback ();
				}
			);
		}
	}
	catch (inError)
	{
		console.error ("error opening UDPSocket");
		console.error (inError.message);
		
		inCallback (inError);
	}
}

/**
 * Close the UDP socket and bind to the specified port.
 *
 * @param {integer} inPort - port to which to bind, eg 5353 for MDNS
 * @param {function} inCallback - function to call on completion
 */
sensible.fxos.Strategy.prototype.close = function ()
{
	this.socket.close ();
}

/**
 * Return the host name of the machine.
 * So far, I've been unable to determine how to do this, and returning the IP number instead.
 *
 * @returns {string} host name
 */
sensible.fxos.Strategy.prototype.getHostName = function ()
{
	// no idea how to do this on FxOS
	if (navigator && navigator.mozWifiManager && navigator.mozWifiManager.connectionInformation)
	{
		return navigator.mozWifiManager.connectionInformation.ipAddress;
	}
	else
	{
		console.error ("sensible.fxos.Strategy.getHostName() can't get wifi connection info");
		return "unknown";
	}
}

/**
 * Return the IP address of the machine.
 *
 * @returns {string} IP address
 */
sensible.fxos.Strategy.prototype.getIPAddress = function ()
{
	if (navigator && navigator.mozWifiManager && navigator.mozWifiManager.connectionInformation)
	{
		return navigator.mozWifiManager.connectionInformation.ipAddress;
	}
	else
	{
		console.error ("sensible.fxos.Strategy.getIPAddress() can't get wifi connection info");
		return "127.0.0.1";
	}
}

/**
 * Listen for packets on the UDP socket.
 *
 * @param {function} inCallback - function to call on reception
 */
sensible.fxos.Strategy.prototype.listen = function (inCallback)
{
	this.socket.addEventListener
	(
		"message",
		function (inMessage)
		{
			inCallback (inMessage.data, inMessage.remoteAddress, inMessage.remotePort);
		}
	);
}

/**
 * Send a packet on the UDP socket.
 *
 * @param {ArrayBuffer} inPacket - packet
 * @param {string} inRemoteAddress - remote address
 * @param {port} inRemotePort - remote port
 */
sensible.fxos.Strategy.prototype.send = function (inPacket, inRemoteAddress, inRemotePort)
{
	if (this.socket.readyState == "closed")
	{
		console.error ("udp socket is closed, reopening");
		
		var	self = this;
		var	port = this.socket.localPort;
		
		this.open
		(
			port,
			function ()
			{
				var	result = self.socket.send (inPacket, inRemoteAddress, inRemotePort); 
				console.log ("send() returns " + result);
			}
		);
	}
	else
	{
		var	result = this.socket.send (inPacket, inRemoteAddress, inRemotePort); 
		console.log ("send() returns " + result);
	}
}

sensible.provide ("sensible.chrome.Server");

sensible.chrome.Server = function (inPort, inDelegate)
{
	console.log ("sensible.chrome.Server listening on port " + inPort);
	
	var	self = this;
	
	chrome.sockets.tcpServer.create
	(
		{
			name: "Sensible chrome server"
		},
		function (inCreateInfo)
		{
			// console.log ("tcpServer.create() completed with socket " + inCreateInfo.socketId);

			self.serverSocketID = inCreateInfo.socketId;
			
			chrome.sockets.tcpServer.listen
			(
				self.serverSocketID,
				"0.0.0.0",
				inPort,
				5,
				function (inResultCode)
				{
					// console.log ("listen() completed with code " + inResultCode);
					
					if (inResultCode < 0)
					{
						console.error ("error code " + inResultCode + " calling listen()");
					}
					else
					{
						chrome.sockets.tcpServer.onAccept.addListener
						(
							function (inAcceptInfo)
							{
								// console.log ("onAccept() completed with socket " + inAcceptInfo.clientSocketId);
					
								var	clientSocketID = inAcceptInfo.clientSocketId;
								
								chrome.sockets.tcp.getInfo
								(
									clientSocketID,
									function (inSocketInfo)
									{
										chrome.sockets.tcp.setPaused
										(
											clientSocketID,
											false,
											function ()
											{
												// have to send the socketID through to the onRequest() call somehow :-S
												var	server = new sensible.chrome.WebServer
												(
													clientSocketID,
													function (inRequest)
													{
														self.onRequest.call (self, clientSocketID, inRequest, inDelegate);
													}
												);
											}
										);
									}
								);
							}
						);
					}
				}
			);
		}
	);
}

sensible.chrome.Server.prototype.onRequest = function (inSocketID, inRequest, inDelegate)
{
	var	self = this;

	// console.log ("sensible.chrome.Server.onRequest() with socket ID " + inSocketID);
	// console.log (inRequest);
	
	try
	{
		sensible.RESTDispatcher.dispatchRequest
		(
			inRequest,
			inDelegate,
			function (inResponse)
			{
				if (inResponse.type == "json")
				{
					var	json = JSON.stringify (inResponse.object);
		
					var	jsonpCallback = inRequest.parameters.callback;
					
					if (jsonpCallback && jsonpCallback.length)
					{
						json = jsonpCallback + "(" + json + ")";
					}
					
					console.log ("sending json response of length " + json.length);
		
					try
					{
						this.sendString (inSocketID, "HTTP/1.0 200 OK\n");
						this.sendString (inSocketID, "Content-Type: application/json\n");
						this.sendString (inSocketID, "Content-Length: " + json.length + "\n");
						this.sendString (inSocketID, "\n");
						
						this.sendString (inSocketID, json);
					}
					catch (inError)
					{
						console.error ("error while sending json");
						console.error (inError);
					}
		
					chrome.sockets.tcp.close (inSocketID);
				}
				else
				if (inResponse.type == "file")
				{
					// we satisfy all file references off the web root
					var	path = "web/" + inResponse.path;
					
					sensible.Util.ajax
					({
						url: path,
						data: null,
						async: true,
						dataType: "string",
						success: function (inData, inTextStatus, inXHR)
						{
							console.log ("sending file " + inResponse.path + " of length " + inData.length);
		
							var	contentType = sensible.Util.mapExtensionToContentType (inResponse.path);
							
							try
							{
								self.sendString (inSocketID, "HTTP/1.0 200 OK\n");
								self.sendString (inSocketID, "Content-Type: " + contentType + "\n");
								self.sendString (inSocketID, "Content-Length: " + inData.length + "\n");
								self.sendString (inSocketID, "\n");
		
								self.sendString (inSocketID, inData);
							}
							catch (inError)
							{
								console.error ("error while sending file");
								console.error (inError);
							}
							
							chrome.sockets.tcp.close (inSocketID);
						},
						error: function (inXHR, inTextStatus)
						{
							console.log ("error getting file: " + inResponse.path);
		
							self.sendString (inSocketID, "HTTP/1.0 404 File Not Found\n");
							self.sendString (inSocketID, "Connection: close\n");
							self.sendString (inSocketID, "\n");
							
							chrome.sockets.tcp.close (inSocketID);
						}
					});
				}
				else
				{
					console.error ("sensible.chrome.Server can't deal with response type " + inResponse.type);
		
					this.sendString (inSocketID, "HTTP/1.0 404 File Not Found\n");
					this.sendString (inSocketID, "Connection: close\n");
					this.sendString (inSocketID, "\n");
				
					chrome.sockets.tcp.close (inSocketID);
				}
			}
		);
		
	}
	catch (inError)
	{
		console.error (inError);
		
		this.sendString (inSocketID, "HTTP/1.0 500 " + inError.message + "\n\n");
		this.sendString (inSocketID, "Connection: close\n");
		this.sendString (inSocketID, "\n");
		
		chrome.sockets.tcp.close (inSocketID);
	}
}

// this is just Javascript gold
// i mean, really?
// this is a hack, as i can't be sure what encoding the receiver is expecting
sensible.chrome.Server.prototype.sendString = function (inSocketID, inString)
{
	var	buffer = new ArrayBuffer (inString.length);
	var	view = new Uint8Array (buffer);
	
	for (var i = 0; i < inString.length; i++)
	{
		view [i] = inString.charCodeAt (i);
	}
	
	// the callback function is not optional, sadly
	chrome.sockets.tcp.send
	(
		inSocketID,
		buffer,
		function (inSendInfo)
		{
			// console.log ("sent " + inSendInfo.bytesSent + " bytes");
		}
	);
}

sensible.chrome.Server.prototype.stop = function ()
{
	chrome.sockets.tcpServer.close (this.serverSocketID);
}

// Fxos Web Server - we do POST etc too

sensible.provide ("sensible.chrome.WebServer");

// assumes that inSocket comes from the onconnect() handler of a server TCP socket

sensible.chrome.WebServer = function (inSocketID, inCallback)
{
	var	self = this;
	
	console.log ("sensible.chrome.WebServer() with socket ID " + inSocketID);

	this.server = new sensible.WebServer (inCallback);
	
	chrome.sockets.tcp.onReceive.addListener
	(
		function (inReceiveInfo)
		{
			if (inReceiveInfo.socketId == inSocketID)
			{
				// console.log ("socket received data of length " + inReceiveInfo.data.byteLength);
				
				self.server.onReadBuffer (inReceiveInfo.data);
			}
		}
	);
}

// Chrome Sensible application

sensible.provide ("sensible.chrome.Application");

sensible.chrome.Application = function (inCallback)
{
	sensible.Application.call (this, inCallback);
}
sensible.inherits (sensible.chrome.Application, sensible.Application);

// SENSIBLE APPLICATION IMPLEMENTATION

sensible.chrome.Application.prototype.loadConfig = function (inCallback)
{
	console.log ("sensible.chrome.Application.loadConfig()");

	if (this.config)
	{
		alert ("hey! we already loaded config!");
	}
	
	var	self = this;

	sensible.Util.ajax
	({
		url: "sensible-config.json",
		data: null,
		async: true,
		dataType: "json",
		success: function (inData, inTextStatus, inXHR)
		{
			self.config = inData;

			for (var key in self.config)
			{
				console.log ("sensible config: " + key + " = " + self.config [key]);
			}
			
			inCallback ();
		},
		error: function (inXHR, inTextStatus)
		{
			inCallback (new Error ("loadConfig can not get sensible-config.json"));
		}
	});
}

sensible.chrome.Application.prototype.loadProperties = function (inCallback)
{
	console.log ("sensible.chrome.Application.loadProperties()");

	var	self = this;

	sensible.Util.ajax
	({
		url: "sensible-properties.json",
		data: null,
		async: true,
		dataType: "json",
		success: function (inData, inTextStatus, inXHR)
		{
			self.properties = inData;

			self.propertiesByKey = new Object ();
			
			// sort the property key cache
			for (var i = 0; i < self.properties.length; i++)
			{
				var	property = self.properties [i];

				console.log ("found sensible property " + property.name);
				self.propertiesByKey [property.name] = property;
			}

			inCallback ();
		},
		error: function (inXHR, inTextStatus)
		{
			inCallback (new Error ("loadProperties can not get sensible-properties.json"));
		}
	});
}


sensible.chrome.Application.prototype.registerHost =
function chrome_application_registerHost (inCallback)
{
	console.log ("chrome.Application.registerHost()");
	
	if (this.config.hostname)
	{
		this.mdns.registerHost (this.config.hostname, null);
	}

	if (inCallback)
	{
		inCallback ();
	}
}

sensible.chrome.Application.prototype.registerService =
function chrome_application_registerService (inCallback)
{
	console.log ("chrome.Application.registerService()");
	
	var	service = this.mdns.registerService
		(this.config.name, this.config.type, null, this.config.port, this.config.description, this.config.ttl);

	console.log ("server advertised as "
		+ service.name + "." + service.type + ":" + service.host + ":" + service.port);

	if (inCallback)
	{
		inCallback ();
	}
}

sensible.chrome.Application.prototype.saveConfig = function (inConfig)
{
	// TODO write config to /sdcard/$sensible.configfilename 
}

sensible.chrome.Application.prototype.saveProperties = function (inProperties)
{
	// TODO write config to /sdcard/$sensible.propertiesfilename 
}

sensible.chrome.Application.prototype.start =
function chrome_application_start (inCallback)
{
	this.startHTTPServer ();
	
	this.mdns = new sensible.MDNS ();

	var	self = this;
	
	this.mdns.start
	(
		function (inError)
		{
			if (inError)
			{
				inCallback.call (self, inError);
			}
			else
			{
				self.registerService
				(
					function ()
					{
						self.registerHost
						(
							function ()
							{
								inCallback.call (self);
							}
						);
					}
				);
			}
		}
	);
}

sensible.chrome.Application.prototype.startHTTPServer =
function chrome_application_startHTTPServer (inCallback)
{
	this.server = new sensible.chrome.Server (this.config.port, this);

	if (inCallback)
	{
		inCallback ();
	}
}

sensible.chrome.Application.prototype.stop =
function chrome_application_stop ()
{
	this.unregisterService ();
	this.stopHTTPServer ();
}

sensible.chrome.Application.prototype.stopHTTPServer =
function chrome_application_stopHTTPServer ()
{
	if (this.server)
	{
		this.server.close ();
		this.server = null;
	}
}

sensible.chrome.Application.prototype.unregisterHost =
function chrome_application_unregisterHost ()
{
	if (this.config.hostname)
	{
		this.mdns.unregisterHost (this.config.hostname);
	}
}

sensible.chrome.Application.prototype.unregisterService =
function chrome_application_unregisterService ()
{
	this.mdns.unregisterService (null, this.config.port);
}

// PRIVATE

// TODO port these from Node to Chrome

sensible.chrome.Application.prototype.onRequest = function (inRequest, outResponse)
{
	console.error ("sensible.chrome.Application.onRequest() not implemented");
}

sensible.chrome.Application.prototype.sendFile =
function chrome_application_sendFile (inPathName, outResponse)
{
	console.error ("sensible.chrome.Application.sendFile() not implemented");
}

// implementation of SocketStrategy for Chrome sockets.udp

sensible.provide ("sensible.chrome.Strategy");

sensible.chrome.Strategy = function ()
{
}

sensible.chrome.Strategy.prototype.addMembership = function (inMulticastAddress, inCallback)
{
	console.log ("sensible.chrome.Strategy.addMembership(" + inMulticastAddress + ")");

	// async = virus
	chrome.sockets.udp.joinGroup (this.socketID, inMulticastAddress, inCallback);
}

sensible.chrome.Strategy.prototype.open = function (inPort, inCallback)
{
	console.log ("sensible.chrome.Strategy.open(" + inPort + ")");

	var	self = this;
	
  chrome.sockets.udp.create
  (
  	{},
  	function (inCreateInfo)
  	{
  		self.socketID = inCreateInfo.socketId;
  		
  		// note that we do NOT bind to 5353 on Chrome
  		// as Chrome itself does not set the reuse option -- boo!
  		// means we can't update our caches from others' queries
  		// which is kinda a shame
  		console.log ("binding ephemeral port, as 5353 is taken on Chrome");
  		
  		chrome.sockets.udp.bind
  		(
  			self.socketID,
  			"0.0.0.0",
  			0,
  			function (inResult)
  			{
  				console.log (inResult);
  				
  				if (inResult < 0)
  				{
  					console.error ("error " + inResult + " binding to port " + inPort);
  				}
  				
  				if (inCallback)
  				{
  					inCallback ();
  				}
  			}
  		);
    }
  );
}

sensible.chrome.Strategy.prototype.close = function ()
{
	chrome.sockets.udp.close (this.socketID);
}

/**
 * Return the host name of the machine.
 *
 * @returns {string} host name
 */
sensible.chrome.Strategy.prototype.getHostName = function ()
{
	console.log ("chrome.Strategy.getHostName() stubbed");
	return "chrome";
}

/**
 * Return the IP address of the machine.
 *
 * @returns {string} IP address
 */
sensible.chrome.Strategy.prototype.getIPAddress = function ()
{
	console.log ("chrome.Strategy.getIPAddress() stubbed");
	return "10.0.1.14";
}

sensible.chrome.Strategy.prototype.enableBroadcast = function ()
{
	// no equivalent in Chrome seems like
}

sensible.chrome.Strategy.prototype.listen = function (inCallback)
{
	var	self = this;
	
	chrome.sockets.udp.onReceive.addListener
	(
		function (inSocketID, inPacket, inRemoteHost, inRemotePort)
		{
			if (inSocketID == self.socketID)
			{
				inCallback (inPacket, inRemoteHost, inRemotePort);
			}
		}
	);
}

// this is passed an ArrayBuffer, happily
sensible.chrome.Strategy.prototype.send = function (inPacket, inRemoteAddress, inRemotePort)
{
	console.log ("chrome.Strategy.send() on socket " + this.socketID);

	chrome.sockets.udp.send
	(
		this.socketID,
		inPacket,
		inRemoteAddress,
		inRemotePort,
		function (inSendInfo)
		{
			if (inSendInfo.resultCode >= 0)
			{
				console.log ("sent " + inSendInfo.bytesSent);
			}
			else
			{
				console.log ("error " + inSendInfo.resultCode + " sending to " + inRemoteAddress + ":" + inRemotePort);
			}
		}
	);
}

// factory that uses mind reading to determine which Application subclass to make
// NOTE the application constructors set gSensibleApplication immediately on construction

sensible.provide ("sensible.ApplicationFactory");

var	gSensibleApplication = null;

sensible.ApplicationFactory = new Object ();

sensible.ApplicationFactory.createApplication = function (inCallback)
{
	console.log ("ApplicationFactory.createApplication()");
	
	if (typeof (http) == "object" && typeof (http.createServer) == "function")
	{
		gSensibleApplication = new sensible.node.Application (inCallback);
	}
	else
	if (typeof (navigator) == "object" && typeof (navigator.mozTCPSocket) == "object")
	{
		gSensibleApplication = new sensible.fxos.Application (inCallback);
	}
	else
	if (typeof (chrome) == "object")
	{
		gSensibleApplication = new sensible.chrome.Application (inCallback);
	}
	else
	{
		inCallback (new Error ("cannot find a sensible Application class for this environment"));
	}
	
	return gSensibleApplication;
}

// factory that uses mind reading to determine which Strategy subclass to make

sensible.provide ("sensible.StrategyFactory");

sensible.StrategyFactory = new Object ();

sensible.StrategyFactory.createStrategy = function ()
{
	console.log ("StrategyFactory.createStrategy()");
	
	var	strategy = null;
	
	if (typeof (http) == "object" && typeof (http.createServer) == "function")
	{
		console.log ("making node strategy");
		strategy = new sensible.node.Strategy ();
	}
	else
	if (typeof (navigator) == "object" && typeof (navigator.mozApps) == "object")
	{
		console.log ("making fxos strategy");
		strategy = new sensible.fxos.Strategy ();
	}
	else
	if (typeof (chrome) == "object")
	{
		console.log ("making chrome strategy");
		strategy = new sensible.chrome.Strategy ();
	}
	else
	{
		throw new Error ("cannot find a sensible Strategy class for this environment");
	}

	return strategy;
}

