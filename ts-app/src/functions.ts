import * as ROSLIB from 'roslib';

// ROS Connection
export function connectToRos(url: string): ROSLIB.Ros {
    const ros = new ROSLIB.Ros({ url });

    ros.on('connection', () => console.log('Connected to websocket server.'));
    ros.on('error', (error: any) => console.log('Error connecting to websocket server:', error));
    ros.on('close', () => console.log('Connection to websocket server closed.'));

    return ros;
}

// Subscribe to a topic
export function subscribe<T>(ros: ROSLIB.Ros, topicName: string, messageType: string, callback: (message: T) => void): ROSLIB.Topic<T> {
    const topic = new ROSLIB.Topic<T>({
        ros,
        name: topicName,
        messageType
    });

    topic.subscribe(callback);

    return topic;
}

// Call a service
export async function callService<T>(ros: ROSLIB.Ros, serviceName: string, serviceType: string, requestData: any, callback: (result: T) => void): Promise<void> {
    const service = new ROSLIB.Service({
        ros,
        name: serviceName,
        serviceType
    });

    const request = new ROSLIB.ServiceRequest(requestData);
    service.callService(request, callback);
}
