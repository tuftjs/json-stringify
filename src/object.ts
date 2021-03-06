import { serializeString } from './string';
import { serializeBuffer } from './buffer';
import { serializeArray } from './array';
import { seenObjects } from './seen-objects';

/**
 * Iterates over all the key/value pairs of an object, converting them to strings one by one and then concatenating
 * them. The resulting string should match the output of JSON.stringify(), with the exception that toJSON() methods are
 * ignored.
 */

export function serializeObject(obj: { [key: string]: any }, safe: boolean): string {
  let str = '{';
  let prefix = '"';
  let key;
  let value;

  for (key in obj) {
    value = obj[key];

    if (typeof value === 'object') {
      str += prefix + key;

      if (value === null) {
        str += '":null';
      }

      else if (value instanceof Date) {
        str += '":"' + value.toISOString() + '"';
      }

      else if (Buffer.isBuffer(value)) {
        str += '":' + serializeBuffer(value);
      }

      else if (safe) {
        if (seenObjects.has(value)) {
          throw Error('Cannot serialize objects that contain a circular reference');
        }

        try {
          seenObjects.add(value);

          str += '":';
          str += Array.isArray(value)
            ? serializeArray(value, true)
            : serializeObject(value, true);
        }

        finally {
          seenObjects.delete(value);
        }
      }

      else {
        str += '":';
        str += Array.isArray(value)
          ? serializeArray(value, false)
          : serializeObject(value, false);
      }

      prefix = ',"';
    }

    else if (typeof value === 'string') {
      str += prefix + key + '":' + serializeString(value);
      prefix = ',"';
    }

    else if (typeof value === 'number') {
      str += prefix + key;
      str += value === Infinity || Number.isNaN(value)
        ? '":null'
        : ('":' + value);
      prefix = ',"';
    }

    else if (typeof value === 'boolean') {
      str += prefix + key + '":' + value;
      prefix = ',"';
    }

    else if (typeof value === 'bigint') {
      throw TypeError('Cannot serialize objects that contain a BigInt');
    }
  }

  return str + '}';
}
