import {
  AuthenticationErrorBCH,
  createAuthenticationProgramExternalStateCommonEmpty,
  createAuthenticationProgramStateCommon,
  generateBytecodeMap,
  OpcodesBCH,
} from '../vm/instruction-sets/instruction-sets';
import { AuthenticationInstruction } from '../vm/instruction-sets/instruction-sets-types';
import {
  AuthenticationProgramStateCommon,
  MinimumProgramState,
  StackState,
} from '../vm/state';

import { compilerOperationsCommon } from './compiler-operations';
import {
  AnyCompilationEnvironment,
  CompilationData,
  CompilationEnvironment,
  Compiler,
  CompilerOperationDataCommon,
} from './compiler-types';
import { compileScript } from './language/compile';
import {
  AuthenticationTemplate,
  AuthenticationTemplateVariable,
} from './template-types';

/**
 * Create a `Compiler` from the provided compilation environment. This method
 * requires a full `CompilationEnvironment` and does not instantiate any new
 * crypto or VM implementations.
 *
 * @param compilationEnvironment - the environment from which to create the
 * compiler
 */
export const createCompiler = <
  CompilerOperationData,
  Environment extends AnyCompilationEnvironment<CompilerOperationData>,
  ProgramState = StackState & MinimumProgramState
>(
  compilationEnvironment: Environment
): Compiler<CompilerOperationData, Environment, ProgramState> => ({
  environment: compilationEnvironment,
  generateBytecode: (
    script: string,
    data: CompilationData<CompilerOperationData>,
    // TODO: TS bug?
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    debug: boolean = false
    // TODO: is there a way to avoid this `any`?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    const result = compileScript<ProgramState, CompilerOperationData>(
      script,
      data,
      compilationEnvironment
    );
    return debug
      ? result
      : result.success
      ? { bytecode: result.bytecode, success: true }
      : { errorType: result.errorType, errors: result.errors, success: false };
  },
});

/**
 * A common `createState` implementation for most compilers.
 *
 * @param instructions - the list of instructions to incorporate in the created
 * state.
 */
export const compilerCreateStateCommon = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instructions: AuthenticationInstruction<any>[]
) =>
  createAuthenticationProgramStateCommon({
    externalState: createAuthenticationProgramExternalStateCommonEmpty(),
    instructions,
    stack: [],
  });

/**
 * Synchronously create a compiler using the default common environment. Because
 * this compiler has no access to Secp256k1, Sha256, or a VM, it cannot compile
 * evaluations or operations which require key derivation or hashing.
 *
 * @param scriptsAndOverrides - a compilation environment from which properties
 * will be used to override properties of the default common compilation
 * environment – must include the `scripts` property
 */
export const createCompilerCommonSynchronous = <
  CompilerOperationData extends CompilerOperationDataCommon,
  Environment extends AnyCompilationEnvironment<CompilerOperationData>,
  ProgramState extends AuthenticationProgramStateCommon<Opcodes, Errors>,
  Opcodes = OpcodesBCH,
  Errors = AuthenticationErrorBCH
>(
  scriptsAndOverrides: Environment
): Compiler<CompilerOperationData, Environment, ProgramState> => {
  return createCompiler<CompilerOperationData, Environment, ProgramState>({
    ...{
      createState: compilerCreateStateCommon,
      opcodes: generateBytecodeMap(OpcodesBCH),
      operations: compilerOperationsCommon,
    },
    ...scriptsAndOverrides,
  });
};

/**
 * Create a partial `CompilationEnvironment` from an `AuthenticationTemplate` by
 * extracting and formatting the `scripts` and `variables` properties.
 *
 * Note, if this `AuthenticationTemplate` might be malformed, first validate it
 * with `validateAuthenticationTemplate`.
 *
 * @param template - the `AuthenticationTemplate` from which to extract the
 * compilation environment
 */
export const authenticationTemplateToCompilationEnvironment = (
  template: AuthenticationTemplate
): Pick<
  CompilationEnvironment,
  'entityOwnership' | 'scripts' | 'variables'
> => {
  const scripts = Object.entries(template.scripts).reduce<{
    [scriptId: string]: string;
  }>((all, [id, def]) => ({ ...all, [id]: def.script }), {});
  const variables = Object.values(template.entities).reduce<{
    [variableId: string]: AuthenticationTemplateVariable;
  }>((all, entity) => ({ ...all, ...entity.variables }), {});
  const entityOwnership = Object.entries(template.entities).reduce<{
    [variableId: string]: string;
  }>(
    (all, [entityId, entity]) => ({
      ...all,
      ...Object.keys(entity.variables ?? {}).reduce(
        (entityVariables, variableId) => ({
          ...entityVariables,
          [variableId]: entityId,
        }),
        {}
      ),
    }),
    {}
  );
  return { entityOwnership, scripts, variables };
};