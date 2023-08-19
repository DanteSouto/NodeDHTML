'use strict';

/*
A comunicação entre .NET Core e Node.js pode ser feita através de um servidor TCP. O aplicativo .NET Core atuará como o 
servidor TCP e o Node.js como o cliente TCP. Dessa forma, podemos estabelecer uma conexão bidirecional para trocar dados.
Aqui está uma implementação simplificada para o cliente TCP em Node.js (PipeClient.js) e para o servidor TCP em .NET Core.
Essas implementações estabelecem uma conexão TCP entre o cliente Node.js (PipeClient) e o servidor .NET Core. O cliente 
pode enviar dados para o servidor e o servidor pode responder com dados de volta. Observe que a implementação .NET Core
é mais robusta, pois trata as conexões de forma assíncrona e lidando com a recepção e envio de dados.
*/

const net = require('net');
const Extensions = require('./Extensions');

module.exports = class PipeClient {
    constructor() {
        this.client = new net.Socket();
        this.dataCallbacks = [];
    }

    connect(server, port) {
        this.client.connect(port, server, () => {
            this.emit('connect');
        });

        this.client.on('data', (data) => {
            this.emit('dataReceived', data);
        });

        this.client.on('close', () => {
            this.emit('close');
        });

        this.client.on('error', (error) => {
            this.emit('error', error);
        });
    }

    write(data) {
        let size = Extensions.intToByteArray(data.length);
        let buffer = Extensions.concatWith(size, data);
        this.client.write(size);
        this.client.write(data);
    }

    disconnect() {
        this.client.end();
    }

    on(event, listener) {
        this.dataCallbacks.push({ event, listener });
    }

    emit(event, ...args) {
        this.dataCallbacks.forEach((callback) => {
            if (callback.event === event) {
                callback.listener(...args);
            }
        });
    }
}

/*
// Server.cs (.NET Core)
using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

class Server
{
    private TcpListener server;
    private TcpClient client;

    public Server(int port)
    {
        server = new TcpListener(IPAddress.Any, port);
        server.Start();
    }

    public async Task Start()
    {
        Console.WriteLine("Server started. Waiting for connections...");

        client = await server.AcceptTcpClientAsync();
        Console.WriteLine("Client connected.");

        await Task.Run(HandleClient);
    }

    private async Task HandleClient()
    {
        var stream = client.GetStream();

        try
        {
            byte[] buffer = new byte[1024];
            int bytesRead;

            while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
            {
                string data = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                Console.WriteLine($"Received from client: {data}");

                // You can process the data received and send a response back if needed
                string response = "Hello from .NET Core!";
                byte[] responseData = Encoding.UTF8.GetBytes(response);
                await stream.WriteAsync(responseData, 0, responseData.Length);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
        finally
        {
            client.Close();
            Console.WriteLine("Client disconnected.");
        }
    }
}

class Program
{
    static async Task Main(string[] args)
    {
        Server server = new Server(8080);
        await server.Start();
    }
}
*/

/*
Essa implementação de PipeClient em .NET Core estabelece uma conexão TCP com o servidor Node.js 
e permite enviar e receber dados através do fluxo de rede. Ela é assíncrona para permitir um 
comportamento mais eficiente em aplicativos assíncronos em .NET Core.
Com essa implementação, você pode se conectar ao servidor Node.js usando o seguinte código:

// PipeClient.cs
using System;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

public class PipeClient
{
    private TcpClient client;
    private NetworkStream stream;
    private CancellationTokenSource cancellationTokenSource;

    public PipeClient()
    {
        client = new TcpClient();
    }

    public async Task ConnectAsync(string server, int port)
    {
        try
        {
            await client.ConnectAsync(server, port);
            stream = client.GetStream();
            cancellationTokenSource = new CancellationTokenSource();
            _ = StartListening(cancellationTokenSource.Token);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error connecting to the server: {ex.Message}");
            throw;
        }
    }

    private async Task StartListening(CancellationToken cancellationToken)
    {
        try
        {
            byte[] buffer = new byte[1024];
            while (!cancellationToken.IsCancellationRequested)
            {
                int bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length, cancellationToken);
                if (bytesRead > 0)
                {
                    string data = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                    Console.WriteLine($"Received from server: {data}");
                }
            }
        }
        catch (OperationCanceledException)
        {
            // This will be thrown when CancellationToken is cancelled, indicating the client is disconnecting.
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error while listening for data: {ex.Message}");
        }
    }

    public async Task SendDataAsync(string data)
    {
        byte[] buffer = Encoding.UTF8.GetBytes(data);
        await stream.WriteAsync(buffer, 0, buffer.Length);
    }

    public void Disconnect()
    {
        cancellationTokenSource?.Cancel();
        stream?.Dispose();
        client?.Close();
    }
}
*/

/*
Essa implementação do PipeClient deve funcionar perfeitamente com o servidor Node.js usando a
implementação de PipeClient.js que forneci anteriormente. Certifique-se de iniciar o servidor
Node.js antes de executar o cliente .NET Core.
static async Task Main(string[] args)
{
    PipeClient pipeClient = new PipeClient();
    await pipeClient.ConnectAsync("localhost", 8080);

    // Send data to the server
    await pipeClient.SendDataAsync("Hello from .NET Core!");

    // Wait for some time to receive data from the server
    await Task.Delay(2000);

    // Disconnect the client
    pipeClient.Disconnect();
}
*/