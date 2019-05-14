export enum Role {
  Empty = '',
  Command = 'Command',
  TreeDataProvider = 'TreeDataProvider'
}

export class BindContext {
  public role: Role;
  public label: string;
  public data: { [key: string]: any } = {};
}

export function hasContext(o: any) {
  return o.__context;
}

export function contextOf(obj: any): BindContext {
  if (!obj.__context) {
    obj.__context = new BindContext();
  }

  return obj.__context;
}
