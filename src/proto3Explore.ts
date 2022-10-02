import * as vscode from 'vscode';
import { /*load*/ Field as ProtoField, Namespace, parse, ReflectionObject, Root, Type } from 'protobufjs';
import { guessScope, Proto3ScopeKind } from './proto3ScopeGuesser';
import { readFileSync } from 'fs';

export async function getWebviewContent(document: vscode.TextDocument, position: vscode.Position): Promise<string> {
  const scope = guessScope(document, position.line);
  if (scope.kind === Proto3ScopeKind.Comment) {
    return;
  }

  const targetRange = document.getWordRangeAtPosition(position) as vscode.Range;
  const messageName = document.getText(targetRange);
  // let imports = await load('./example/protos/v3/imports.proto');
  //imports.nested.v3.nested.test.nested.proto3.TestMsg
  // const protoDocument = await load(document.fileName);
  const protoSrc = await readFileSync(document.fileName, { encoding: 'utf-8' });
  let protoRoot = new Root();
  var parsedImports = parse(protoSrc, protoRoot);
  const currentPackage = parsedImports.package;
  const currentPackageComponents = currentPackage.split('.');
  let currentRoot: any = protoRoot;
  for (let namespace of currentPackageComponents) {
    currentRoot = currentRoot.nested[namespace];
  }
  var currentMsg = currentRoot[messageName] as Type;
  let message = messageName;
  for (var fieldName in currentMsg.fields) {
    const field = currentMsg.fields[fieldName] as ProtoField;
    message += `\n    ${field.type} ${fieldName}`
  }

  return message;
}

function buildMessage(message: Type): Message {
  let result = new Message();
  result.typeName = message.name;
  for (var fieldName in message.fields) {
    let newField = new Field();
    const field = message.fields[fieldName] as ProtoField;
    newField.name = field.name;
    newField.id = field.id;
    // todo:
    // newField.attributes = field.options;
    if (builtIn(field.type)) {
      newField.type = field.type;
    } else {
      //TODO: get name of file with the message; load; seek the message
    }
    

  }


  return result;
}

class Field {
  public type: string | Message;
  public name: string;
  public id: Number;
  public attributes: Array<any>;
  public message?: Message;
}

class Message {
  public children: Array<Field>;
  public typeName: string;
  public attributes: Array<string>;
}