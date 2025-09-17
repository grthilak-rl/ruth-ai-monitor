import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

import { Label } from '@radix-ui/react-label';



const AIChatbotIntegration = () => {
  const [modelPath, setModelPath] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunModel = async () => {
    setLoading(true);
    setError(null);
    setOutput('');

    try {
      // Simulate API call to backend to run the model
      // In a real application, this would be an axios call to your backend
      // For example: await axios.post('/api/chatbot/run-model', { modelPath });
      // And the backend would execute the model and return the output.
      console.log(`Running model from path: ${modelPath}`);
      setOutput(`Model '${modelPath}' simulated to be running. Output will appear here.`);
    } catch (err) {
      console.error('Failed to run model:', err);
      setError('Failed to run model. Please check the path and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>AI Chatbot Integration - Industrial Safety Monitor</title>
        <meta name="description" content="Integrate and run AI chatbot models for enhanced safety monitoring" />
      </Helmet>

      <NavigationHeader alertCount={0} onNavigate={() => {}} />
      
      <div className="pt-[60px]">
        <div className="p-6">
          <BreadcrumbNavigation customBreadcrumbs={[]} />
          
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">AI Chatbot Model Integration</h2>
              </div>
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="model-path">Model Path</Label>
                  <Input
                    type="text"
                    id="model-path"
                    placeholder="e.g., /models/chatbot_v1.pth or C:\models\chatbot_v1.h5"
                    value={modelPath}
                    onChange={(e) => setModelPath(e.target.value)}
                  />
                </div>
                <Button onClick={handleRunModel} disabled={loading}>
                  {loading ? 'Running...' : 'Run Model'}
                </Button>
                {error && <p className="text-red-500">Error: {error}</p>}
                {output && (
                  <div className="bg-card border border-border rounded-lg shadow-md p-6 mt-4">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold">Model Output</h3>
                    </div>
                    <div>
                      <pre className="whitespace-pre-wrap text-sm">{output}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbotIntegration;