'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HistoryItem {
    id: number;
    type: 'generation' | 'tool';
    model_type?: string;
    tool_type?: string;
    prompt?: string;
    input_image_url?: string;
    output_image_url: string;
    points_consumed: number;
    created_at: string;
}

interface HistoryListProps {
    userId: string;
}

export function HistoryList({ userId }: HistoryListProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`/api/history?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json() as HistoryItem[];
                    setHistory(data);
                }
            } catch (error) {
                console.error('获取历史记录失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [userId]);

    if (loading) {
        return <div>加载中...</div>;
    }

    return (
        <Tabs defaultValue="generations" className="space-y-4">
            <TabsList>
                <TabsTrigger value="generations">生成历史</TabsTrigger>
                <TabsTrigger value="tools">工具使用</TabsTrigger>
            </TabsList>

            <TabsContent value="generations">
                <div className="grid gap-4">
                    {history
                        .filter(item => item.type === 'generation')
                        .map(item => (
                            <Card key={item.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="font-medium">{item.model_type}</div>
                                            {item.prompt && (
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {item.prompt}
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-500 mt-2">
                                                {formatDistanceToNow(new Date(item.created_at), {
                                                    addSuffix: true,
                                                    locale: zhCN
                                                })}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-500">
                                                消耗积分: {item.points_consumed}
                                            </div>
                                            {item.output_image_url && (
                                                <img
                                                    src={item.output_image_url}
                                                    alt="生成结果"
                                                    className="w-20 h-20 object-cover rounded mt-2"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </TabsContent>

            <TabsContent value="tools">
                <div className="grid gap-4">
                    {history
                        .filter(item => item.type === 'tool')
                        .map(item => (
                            <Card key={item.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="font-medium">{item.tool_type}</div>
                                            <div className="text-sm text-gray-500 mt-2">
                                                {formatDistanceToNow(new Date(item.created_at), {
                                                    addSuffix: true,
                                                    locale: zhCN
                                                })}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-500">
                                                消耗积分: {item.points_consumed}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                {item.input_image_url && (
                                                    <img
                                                        src={item.input_image_url}
                                                        alt="输入图片"
                                                        className="w-20 h-20 object-cover rounded"
                                                    />
                                                )}
                                                {item.output_image_url && (
                                                    <img
                                                        src={item.output_image_url}
                                                        alt="输出图片"
                                                        className="w-20 h-20 object-cover rounded"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </TabsContent>
        </Tabs>
    );
} 