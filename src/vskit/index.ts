import * as vscode from 'vscode';

import { Role, hasContext, contextOf } from './context';

interface Disposable {
  dispose(): any;
}

/////////////////
// Annotations //
/////////////////

/**
 * Command registers function or method as command
 * @param name command name
 */
export function Command(name: string): MethodDecorator {
  return function (target: any, propKey: string, descr: PropertyDescriptor) {
    const ctx = contextOf(descr.value);
    ctx.label = name || propKey;
    ctx.role = Role.Command;

    descr.enumerable = true;
    return descr;
  };
}

/**
 * TreeDataProvider registers object as tree data provider
 * @param name view name
 */
export function TreeDataProvider(name?: string): ClassDecorator {
  return function (target: any) {
    const ctx = contextOf(target.prototype);

    ctx.label = name || target.name;
    ctx.role = Role.TreeDataProvider;
    return target;
  };
}

/**
 * ContextProperty binds property value to context.
 *
 * `setContext` command will be executed each time value changes.
 *
 * @param key Context key
 */
export function ContextProperty(key?: string): PropertyDecorator {
  return function (target: any, propKey: string) {
    let val = target[propKey] || null;
    if (delete target[propKey]) {
      Object.defineProperty(target, propKey, {
        enumerable: true,
        configurable: false,
        get: () => val,
        set: (newVal: any) => {
          val = newVal;
          vscode.commands.executeCommand('setContext', key || propKey, newVal);
        }
      });
    }
  };
}

/////////////////////
// VSCode Injector //
/////////////////////

export function registerValue(o: any, parent?: any): Disposable {
  const ctx = contextOf(o);
  const label = parent && hasContext(parent) ? `${contextOf(parent).label}.${ctx.label}` : ctx.label;

  switch (ctx.role) {
    case Role.Command:
      console.log(`vskit: register command '${label}'`);
      return vscode.commands.registerCommand(label, o.bind(parent));
    case Role.TreeDataProvider:
      console.log(`vskit: register tree data provider '${label}'`);
      return vscode.window.registerTreeDataProvider(label, o);
    default:
      throw new Error(`cannot inject '${label}' as '${ctx.role}'`);
  }
}

export function register(ctx: vscode.ExtensionContext, ...items: any) {
  items.forEach(i => ctx.subscriptions.push(...registerObject(i)));
}

function registerObject(o: any): Disposable[] {
  let subs = [];
  if (hasContext(o)) {
    subs.push(registerValue(o));
  }

  for (let k in o) {
    const val = o[k];
    if (hasContext(val)) {
      subs.push(registerValue(val, o));
    }
  }

  return subs;
}
