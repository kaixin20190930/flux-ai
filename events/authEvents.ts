// app/lib/events/authEvents.ts

type AuthEventCallback = () => void;

class AuthEventEmitter {
    private static listeners: AuthEventCallback[] = [];

    static subscribe(callback: AuthEventCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    static emit() {
        this.listeners.forEach(listener => listener());
    }
}

export default AuthEventEmitter;