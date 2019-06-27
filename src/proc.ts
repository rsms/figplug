import { promisify } from 'util'
import * as cp from 'child_process'

export const exec = promisify(cp.execFile)

export interface SpawnedProc<
  ProcType extends cp.ChildProcess|cp.ChildProcessWithoutNullStreams
> extends Promise<number /* status code */ > {
  proc :ProcType
}

export function spawn(
  command: string,
  options?: cp.SpawnOptionsWithoutStdio
): SpawnedProc<cp.ChildProcessWithoutNullStreams>;

export function spawn(
  command: string,
  options: cp.SpawnOptions
): SpawnedProc<cp.ChildProcess>;

export function spawn(
  command: string,
  args?: ReadonlyArray<string>,
  options?: cp.SpawnOptionsWithoutStdio
): SpawnedProc<cp.ChildProcessWithoutNullStreams>;

export function spawn(
  command: string,
  args: ReadonlyArray<string>,
  options: cp.SpawnOptions
): SpawnedProc<cp.ChildProcess>;

export function spawn(
  command: string,
  arg1? :ReadonlyArray<string>
        |cp.SpawnOptions
        |cp.SpawnOptionsWithoutStdio,
  arg2? :cp.SpawnOptions
        |cp.SpawnOptionsWithoutStdio,
) :SpawnedProc<cp.ChildProcess|cp.ChildProcessWithoutNullStreams> {
  let proc :cp.ChildProcess|cp.ChildProcessWithoutNullStreams

  if (arg2 && arg1) {
    proc = cp.spawn(
      command,
      arg1 as ReadonlyArray<string>,
      arg2 as cp.SpawnOptions|cp.SpawnOptionsWithoutStdio
    )
  } else if (arg2) {
    proc = cp.spawn(command, arg2 as cp.SpawnOptionsWithoutStdio)
  } else if (arg1) {
    proc = cp.spawn(
      command,
      arg1 as cp.SpawnOptionsWithoutStdio | cp.SpawnOptions
    )
  } else {
    proc = cp.spawn(command)
  }

  let p = new Promise<number>((resolve, reject) => {
    proc.on("close", code => resolve(code))
    proc.on("error", err => reject(err))
  }) as any as SpawnedProc<cp.ChildProcess|cp.ChildProcessWithoutNullStreams>

  p.proc = proc

  return p
}
