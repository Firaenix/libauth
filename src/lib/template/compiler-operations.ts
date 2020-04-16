import {
  bigIntToBinUint64LE,
  bigIntToBitcoinVarInt,
  numberToBinUint32LE,
} from '../format/numbers';
import { dateToLocktime } from '../format/time';
import { decodeHdPublicKey, deriveHdPath } from '../key/hd-key';
import { bigIntToScriptNumber } from '../vm/instruction-sets/instruction-sets';

import { CompilerDefaults } from './compiler-defaults';
import {
  attemptCompilerOperations,
  compilerOperationHelperAddressIndex,
  compilerOperationHelperDeriveHdPrivateNode,
  compilerOperationHelperUnknownEntity,
  compilerOperationRequires,
} from './compiler-operation-helpers';
import { CompilerOperationResult } from './compiler-types';
import { HdKey } from './template-types';

export const compilerOperationAddressData = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['addressData'],
  environmentProperties: [],
  operation: (identifier, data) => {
    const { addressData } = data;
    if (identifier in addressData) {
      return { bytecode: addressData[identifier], status: 'success' };
    }
    return {
      error: `Identifier "${identifier}" refers to an AddressData, but "${identifier}" was not provided in the CompilationData "addressData".`,
      recoverable: true,
      status: 'error',
    };
  },
});

export const compilerOperationWalletData = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['walletData'],
  environmentProperties: [],
  operation: (identifier, data) => {
    const { walletData } = data;
    if (identifier in walletData) {
      return { bytecode: walletData[identifier], status: 'success' };
    }
    return {
      error: `Identifier "${identifier}" refers to a WalletData, but "${identifier}" was not provided in the CompilationData "walletData".`,
      recoverable: true,
      status: 'error',
    };
  },
});

export const compilerOperationCurrentBlockTime = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['currentBlockTime'],
  environmentProperties: [],
  operation: (identifier, data) => {
    const result = dateToLocktime(data.currentBlockTime);
    return typeof result === 'string'
      ? {
          error: `Cannot resolve "${identifier} – the Date provided as "currentBlockTime" in the compilation data is outside the range which can be encoded in locktime."`,
          status: 'error',
        }
      : { bytecode: result, status: 'success' };
  },
});

export const compilerOperationCurrentBlockHeight = compilerOperationRequires({
  canBeSkipped: false,
  dataProperties: ['currentBlockHeight'],
  environmentProperties: [],
  operation: (_, data) => ({
    bytecode: bigIntToScriptNumber(BigInt(data.currentBlockHeight)),
    status: 'success',
  }),
});

export const compilerOperationSigningSerializationCorrespondingOutput = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) =>
      data.operationData.correspondingOutput === undefined
        ? { bytecode: Uint8Array.of(), status: 'success' }
        : {
            bytecode: data.operationData.correspondingOutput,
            status: 'success',
          },
  }
);

export const compilerOperationSigningSerializationCorrespondingOutputHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) =>
      data.operationData.correspondingOutput === undefined
        ? { bytecode: Uint8Array.of(), status: 'success' }
        : {
            bytecode: environment.sha256.hash(
              environment.sha256.hash(data.operationData.correspondingOutput)
            ),
            status: 'success',
          },
  }
);

export const compilerOperationSigningSerializationCoveredBytecode = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.operationData.coveredBytecode,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationCoveredBytecodeLength = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: bigIntToBitcoinVarInt(
        BigInt(data.operationData.coveredBytecode.length)
      ),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationLocktime = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(data.operationData.locktime),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationOutpointIndex = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(data.operationData.outpointIndex),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationOutpointTransactionHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.operationData.outpointTransactionHash,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationOutputValue = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: bigIntToBinUint64LE(BigInt(data.operationData.outputValue)),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationSequenceNumber = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(data.operationData.sequenceNumber),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionOutpoints = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.operationData.transactionOutpoints,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionOutpointsHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) => ({
      bytecode: environment.sha256.hash(
        environment.sha256.hash(data.operationData.transactionOutpoints)
      ),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionOutputs = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.operationData.transactionOutputs,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionOutputsHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) => ({
      bytecode: environment.sha256.hash(
        environment.sha256.hash(data.operationData.transactionOutputs)
      ),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionSequenceNumbers = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: data.operationData.transactionSequenceNumbers,
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationTransactionSequenceNumbersHash = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: ['sha256'],
    operation: (_, data, environment) => ({
      bytecode: environment.sha256.hash(
        environment.sha256.hash(data.operationData.transactionSequenceNumbers)
      ),
      status: 'success',
    }),
  }
);

export const compilerOperationSigningSerializationVersion = compilerOperationRequires(
  {
    canBeSkipped: false,
    dataProperties: ['operationData'],
    environmentProperties: [],
    operation: (_, data) => ({
      bytecode: numberToBinUint32LE(data.operationData.version),
      status: 'success',
    }),
  }
);

export const compilerOperationKeyPublicKeyCommon = attemptCompilerOperations(
  [
    compilerOperationRequires({
      canBeSkipped: true,
      dataProperties: ['keys'],
      environmentProperties: [],
      operation: (identifier, data) => {
        const { keys } = data;
        const { publicKeys } = keys;
        const [variableId] = identifier.split('.');
        if (
          publicKeys !== undefined &&
          (publicKeys[variableId] as Uint8Array | undefined) !== undefined
        ) {
          return { bytecode: publicKeys[variableId], status: 'success' };
        }
        return { status: 'skip' };
      },
    }),
  ],
  compilerOperationRequires({
    canBeSkipped: false,
    dataProperties: ['keys'],
    environmentProperties: ['secp256k1'],
    operation: (identifier, data, environment) => {
      const { keys } = data;
      const { secp256k1 } = environment;
      const { privateKeys } = keys;
      const [variableId] = identifier.split('.');

      if (
        privateKeys !== undefined &&
        (privateKeys[variableId] as Uint8Array | undefined) !== undefined
      ) {
        return {
          bytecode: secp256k1.derivePublicKeyCompressed(
            privateKeys[variableId]
          ),
          status: 'success',
        };
      }
      return {
        error: `Identifier "${identifier}" refers to a public key, but no public or private keys for "${variableId}" were provided in the compilation data.`,
        recoverable: true,
        status: 'error',
      };
    },
  })
);

export const compilerOperationHdKeyPublicKeyCommon = attemptCompilerOperations(
  [
    compilerOperationRequires({
      canBeSkipped: true,
      dataProperties: ['hdKeys'],
      environmentProperties: [],
      operation: (identifier, data) => {
        const { hdKeys } = data;
        const { derivedPublicKeys } = hdKeys;
        const [variableId] = identifier.split('.');

        if (
          derivedPublicKeys !== undefined &&
          (derivedPublicKeys[variableId] as Uint8Array | undefined) !==
            undefined
        ) {
          return { bytecode: derivedPublicKeys[variableId], status: 'success' };
        }

        return { status: 'skip' };
      },
    }),
  ],
  compilerOperationRequires({
    canBeSkipped: false,
    dataProperties: ['hdKeys'],
    environmentProperties: [
      'entityOwnership',
      'ripemd160',
      'secp256k1',
      'sha256',
      'sha512',
      'variables',
    ],
    operation:
      // eslint-disable-next-line complexity
      (identifier, data, environment): CompilerOperationResult => {
        const { hdKeys } = data;
        const { hdPrivateKeys, addressIndex, hdPublicKeys } = hdKeys;
        const [variableId] = identifier.split('.');

        const entityId = environment.entityOwnership[variableId] as
          | string
          | undefined;
        if (entityId === undefined) {
          return compilerOperationHelperUnknownEntity(identifier, variableId);
        }

        if (addressIndex === undefined) {
          return compilerOperationHelperAddressIndex(identifier);
        }

        const entityHdPrivateKey =
          hdPrivateKeys === undefined ? undefined : hdPrivateKeys[entityId];

        /**
         * Guaranteed to be an `HdKey` if this method is reached in the compiler.
         */
        const hdKey = environment.variables[variableId] as HdKey;

        if (entityHdPrivateKey !== undefined) {
          const privateResult = compilerOperationHelperDeriveHdPrivateNode({
            addressIndex,
            entityHdPrivateKey,
            entityId,
            environment,
            hdKey,
            identifier,
          });
          if (privateResult.status === 'error') return privateResult;
          return {
            bytecode: environment.secp256k1.derivePublicKeyCompressed(
              privateResult.bytecode
            ),
            status: 'success',
          };
        }

        const entityHdPublicKey =
          hdPublicKeys === undefined ? undefined : hdPublicKeys[entityId];

        if (entityHdPublicKey === undefined) {
          return {
            error: `Identifier "${identifier}" refers to an HdKey owned by "${entityId}", but an HD private key or HD public key for this entity was not provided in the compilation data.`,
            recoverable: true,
            status: 'error',
          };
        }

        const addressOffset =
          hdKey.addressOffset ?? CompilerDefaults.hdKeyAddressOffset;
        const privateDerivationPath =
          hdKey.privateDerivationPath ??
          CompilerDefaults.hdKeyPrivateDerivationPath;
        const publicDerivationPath =
          hdKey.publicDerivationPath ?? privateDerivationPath.replace('m', 'M');

        const i = addressIndex + addressOffset;
        const instancePath = publicDerivationPath.replace('i', i.toString());

        const masterContents = decodeHdPublicKey(
          environment,
          entityHdPublicKey
        );
        if (typeof masterContents === 'string') {
          return {
            error: `Could not generate "${identifier}" – the HD public key provided for "${entityId}" could not be decoded: ${masterContents}`,
            status: 'error',
          };
        }

        const instanceNode = deriveHdPath(
          environment,
          masterContents.node,
          instancePath
        );

        if (typeof instanceNode === 'string') {
          return {
            error: `Could not generate "${identifier}" – the path "${instancePath}" could not be derived for entity "${entityId}": ${instanceNode}`,
            status: 'error',
          };
        }

        return { bytecode: instanceNode.publicKey, status: 'success' };
      },
  })
);

/* eslint-disable camelcase */
export const compilerOperationsCommon = {
  addressData: compilerOperationAddressData,
  currentBlockHeight: compilerOperationCurrentBlockHeight,
  currentBlockTime: compilerOperationCurrentBlockTime,
  hdKey: {
    public_key: compilerOperationHdKeyPublicKeyCommon,
  },
  key: {
    public_key: compilerOperationKeyPublicKeyCommon,
  },
  signingSerialization: {
    corresponding_output: compilerOperationSigningSerializationCorrespondingOutput,
    corresponding_output_hash: compilerOperationSigningSerializationCorrespondingOutputHash,
    covered_bytecode: compilerOperationSigningSerializationCoveredBytecode,
    covered_bytecode_length: compilerOperationSigningSerializationCoveredBytecodeLength,
    locktime: compilerOperationSigningSerializationLocktime,
    outpoint_index: compilerOperationSigningSerializationOutpointIndex,
    outpoint_transaction_hash: compilerOperationSigningSerializationOutpointTransactionHash,
    output_value: compilerOperationSigningSerializationOutputValue,
    sequence_number: compilerOperationSigningSerializationSequenceNumber,
    transaction_outpoints: compilerOperationSigningSerializationTransactionOutpoints,
    transaction_outpoints_hash: compilerOperationSigningSerializationTransactionOutpointsHash,
    transaction_outputs: compilerOperationSigningSerializationTransactionOutputs,
    transaction_outputs_hash: compilerOperationSigningSerializationTransactionOutputsHash,
    transaction_sequence_numbers: compilerOperationSigningSerializationTransactionSequenceNumbers,
    transaction_sequence_numbers_hash: compilerOperationSigningSerializationTransactionSequenceNumbersHash,
    version: compilerOperationSigningSerializationVersion,
  },
  walletData: compilerOperationWalletData,
};
/* eslint-enable camelcase */