import React from 'react';
import Layout from '../../components/Layout';
import ChatAssistance from './components/ChatAssistance';

const AIChatAssistancePage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">AI Safety Assistant</h1>
        <div className="bg-card rounded-lg shadow-md p-6">
          <ChatAssistance />
        </div>
      </div>
    </Layout>
  );
};

export default AIChatAssistancePage;