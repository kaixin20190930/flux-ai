'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface UsageStatsProps {
    userId: string;
}

interface StatsData {
    totalGenerations: number;
    totalTools: number;
    totalPoints: number;
    dailyStats: {
        date: string;
        generations: number;
        tools: number;
        points: number;
    }[];
    modelStats: {
        model: string;
        count: number;
    }[];
    toolStats: {
        tool: string;
        count: number;
    }[];
}

export function UsageStats({ userId }: UsageStatsProps) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`/api/stats?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json() as StatsData;
                    setStats(data);
                }
            } catch (error) {
                console.error('获取统计数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userId]);

    if (loading) {
        return <div>加载中...</div>;
    }

    if (!stats) {
        return <div>暂无统计数据</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>总生成次数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalGenerations}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>总工具使用次数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTools}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>总消耗积分</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPoints}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>每日使用统计</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dailyStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="generations" name="生成次数" fill="#8884d8" />
                                <Bar dataKey="tools" name="工具使用次数" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>模型使用分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {stats.modelStats.map((stat) => (
                                <div key={stat.model} className="flex justify-between">
                                    <span>{stat.model}</span>
                                    <span className="font-medium">{stat.count}次</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>工具使用分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {stats.toolStats.map((stat) => (
                                <div key={stat.tool} className="flex justify-between">
                                    <span>{stat.tool}</span>
                                    <span className="font-medium">{stat.count}次</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 