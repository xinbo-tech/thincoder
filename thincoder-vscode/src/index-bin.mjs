/**
 * index-bin.mjs — binary I/O for the semantic vector index (split out of indexer.mjs).
 *
 * vectors.bin layout: [4B dim][4B count][count × 4B offsets][all raw Float32 vectors]
 */

export function encodeVectors(dim, vectors) {
  const count = vectors.length
  const headerSize = 8 + count * 4
  const dataSize = count * dim * 4
  const buf = Buffer.alloc(headerSize + dataSize)

  buf.writeUInt32LE(dim, 0)
  buf.writeUInt32LE(count, 4)

  let offset = headerSize
  for (let i = 0; i < count; i++) {
    buf.writeUInt32LE(offset, 8 + i * 4)
    const vec = vectors[i]
    for (let j = 0; j < dim; j++) {
      buf.writeFloatLE(vec[j], offset + j * 4)
    }
    offset += dim * 4
  }

  return buf
}

export function decodeVectors(buf) {
  const dim = buf.readUInt32LE(0)
  const count = buf.readUInt32LE(4)

  const vectors = []
  for (let i = 0; i < count; i++) {
    const offset = buf.readUInt32LE(8 + i * 4)
    const vec = new Float32Array(dim)
    for (let j = 0; j < dim; j++) {
      vec[j] = buf.readFloatLE(offset + j * 4)
    }
    vectors.push(vec)
  }

  return { dim, vectors }
}