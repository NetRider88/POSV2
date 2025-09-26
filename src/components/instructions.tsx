
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Bot, Telescope, CalendarCheck } from "lucide-react";

export function Instructions() {
  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Welcome to Talabat Test Pilot</CardTitle>
        <CardDescription>
          Your all-in-one environment to test, validate, and prepare your POS integration for going live. Follow these steps to ensure a smooth launch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">

          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="font-bold text-lg">1</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Generate API Requests with AI</h3>
              <p className="text-muted-foreground mt-1">
                Navigate to the <span className="font-semibold text-foreground">API Request Generator</span> tab. Describe a test scenario in plain English (e.g., "a new order with two items"). Our AI will generate a valid JSON API request payload for you. This is a great way to understand the expected request structure.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="font-bold text-lg">2</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Test Your Integration</h3>
              <p className="text-muted-foreground mt-1">
                Go to the <span className="font-semibold text-foreground">API Simulator</span> tab. You'll find a unique endpoint URL. Configure your POS system to send `POST` requests to this URL. All incoming requests will appear in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="font-bold text-lg">3</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Validate Your Payloads</h3>
              <p className="text-muted-foreground mt-1">
                As requests arrive in the API Simulator, we will automatically validate them against our API documentation. You will get immediate feedback:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                <li><span className="text-green-600 font-semibold">Success:</span> Your payload is correctly structured.</li>
                <li><span className="text-red-600 font-semibold">Failed:</span> Your payload has errors. The details will show you exactly what to fix.</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                You must successfully send at least one valid <span className="font-semibold text-foreground">Menu Push</span> and one valid <span className="font-semibold text-foreground">Order Payload</span>.
              </p>
            </div>
          </div>
          
           <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="font-bold text-lg">4</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Monitor Performance (Demo)</h3>
              <p className="text-muted-foreground mt-1">
                The <span className="font-semibold text-foreground">Monitoring</span> tab shows a dashboard with key performance metrics. Please note that this currently shows sample data to demonstrate the kinds of metrics you'll have access to once live.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="font-bold text-lg">5</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Go Live!</h3>
              <p className="text-muted-foreground mt-1">
                Once you have passed all the required API tests, the <span className="font-semibold text-foreground">Go Live</span> tab will become available. From there, you can book an appointment with our engineering team to finalize your integration and go live.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
