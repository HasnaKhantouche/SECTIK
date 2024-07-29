import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { encoding_for_model } from 'tiktoken';


export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            console.log('Message received from webview:', message);
            switch (message.type) {
                case 'getFiles': {
                    const files = await this._getFiles();
                    console.log('Posting files to webview:', files);
                    webviewView.webview.postMessage({ type: 'files', files });
                    break;
                }
                case 'calculateTokens': {
                    console.log('Calculating tokens for files:', message.files);
                    const tokens = await this._calculateTokens(message.files);
                    console.log('Posting token count to webview:', tokens);
                    webviewView.webview.postMessage({ type: 'tokenCount', tokens });
                    break;
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'reset.css'))
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'vscode.css'))
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'out', 'compiled', 'sidebar.js'))
        );
        const arrowIconUri = webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media', 'arrow.png'))
        );
        console.log('Arrow icon URI:', arrowIconUri.toString());

        const nonce = getNonce();
        console.log('Generated nonce:', nonce); // Add logging for nonce
        const cspSource = webview.cspSource;
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https:; script-src 'nonce-${nonce}'; style-src ${cspSource} 'unsafe-inline' https:; font-src ${cspSource} https:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <script nonce="${nonce}"></script>
                <style>
  .section-header {
    font-size: 1.5em;
    margin: 3px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: inherit;
    padding: 0;
    text-align: left;
    margin-bottom: 15px;
  }

  .toggle-icon {
    width: 10px;
    height: 10px;
    transition: transform 0.3s;
    margin-right: 2px;
  }

  label {
    display: block;
    margin: 3.5px 0;
    align-items: center;
    margin-bottom: 5px;
  }

  .section {
    margin-bottom: 30px;
  }

  input[type='checkbox'] {
    accent-color: black !important; /* Ensures color is applied */
    border-color: 2px solid white !important; /* Border color */
    background-color: black !important; /* Background color */
    width: 16px !important; /* Size of the checkbox */
    height: 16px !important; /* Size of the checkbox */
    cursor: pointer !important; /* Pointer cursor on hover */
  }

  input[type='checkbox']:checked {
    background-color: black !important; /* Background color when checked */
    border-color: 5px solid white !important; /* Border color when checked */
  }

  .calculate-btn {
    border: 1px solid white !important; /* Border color */
    padding: 6px 4px !important;
    width: 100% !important;
    text-align: center !important;
    outline: 1px solid transparent !important;
    outline-offset: 2px !important;
    color: white !important;
    background: black !important;
  }

  .calculate-btn:hover {
    cursor: pointer !important;
    background: black !important;
  }

  .section-header:hover {
    background: none !important;
  }

  .calculate-btn:focus {
    outline-color: white !important;
  }
</style>
            </head>
            <body>
                <div id="app" data-arrow-icon-uri="${arrowIconUri}"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
    

    private async _getFiles(): Promise<string[]> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
        if (!workspaceFolder) {
            console.error('Workspace folder not found');
            return [];
        }
    
        try {
            const files = await new Promise<string[]>((resolve, reject) => {
                fs.readdir(workspaceFolder!, (err, files: string[]) => {
                    if (err) {
                        console.error(`Error reading directory: ${err.message}`);
                        reject(err);
                    } else {
                        resolve(files.filter(file => file.endsWith('.js') || file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.svg') || file.endsWith('.css') || file.endsWith('.svelte') || file.endsWith('.html') || file.endsWith('.ts')));
                    }
                });
            });
    
            console.log('Files retrieved:', files); // Log retrieved files
    
            return files;
        } catch (error) {
            console.error('Error retrieving files:', error);
            return [];
        }
    }
    
    

    private async _calculateTokens(files: string[]): Promise<number> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
        if (!workspaceFolder) {
            return 0;
        }

        let totalTokens = 0;
        const enc = encoding_for_model('gpt-3.5-turbo');

        for (const file of files) {
            const filePath = path.join(workspaceFolder, file);
            const fileContents = await fs.promises.readFile(filePath, 'utf-8');
            const tokenCount = enc.encode(fileContents).length;
            totalTokens += tokenCount;
        }

        console.log('Total tokens calculated:', totalTokens); // Log total tokens
        return totalTokens;
    }

}

function getNonce(): string {
    let text: string = '';
    const possible: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

