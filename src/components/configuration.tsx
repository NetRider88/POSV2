import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload } from "lucide-react";

export function Configuration() {
  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Integration Configuration</CardTitle>
        <CardDescription>
          Manage your Talabat POS integration details. Securely store and manage your credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="integration-name">Integration Name</Label>
            <Input id="integration-name" placeholder="e.g., 'Perfect POS UAE'" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="integration-code">Integration Code</Label>
              <Input id="integration-code" placeholder="e.g., 'perfect-pos-ae'" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input id="base-url" placeholder="Your POS API endpoint" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plugin-credentials">Plugin Credentials</Label>
            <Input id="plugin-credentials" type="password" placeholder="Credentials provided by Talabat" />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <Button>Save Configuration</Button>
      </CardFooter>
    </Card>
  );
}
