import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ day: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { day } = await params;
        const dayNumber = parseInt(day);

        if (isNaN(dayNumber) || dayNumber < 1) {
            return NextResponse.json({ error: 'Invalid day number' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const enrollmentId = searchParams.get('enrollmentId');
        const token = searchParams.get('token');

        if (!enrollmentId || !token) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Verify enrollment ownership and token
        const enrollment = await db.programEnrollment.findFirst({
            where: {
                id: enrollmentId,
                userId: session.user.id
            },
            select: {
                id: true,
                currentDay: true,
                programId: true
            }
        });

        if (!enrollment) {
            return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
        }

        // Verify user can access this day (must be <= currentDay)
        if (dayNumber > enrollment.currentDay) {
            return NextResponse.json({ error: 'Day not yet unlocked' }, { status: 403 });
        }

        // Fetch day data with parallel queries
        const module = await db.programModule.findUnique({
            where: {
                programId_dayNumber: {
                    programId: enrollment.programId,
                    dayNumber
                }
            },
            include: {
                tasks: {
                    orderBy: { order: 'asc' },
                    include: {
                        completions: {
                            where: { enrollmentId: enrollment.id },
                            take: 1
                        }
                    }
                }
            }
        });

        if (!module) {
            return NextResponse.json({ error: 'Day not found' }, { status: 404 });
        }

        // Format response
        const formattedTasks = module.tasks.map((task: any) => {
            const completion = task.completions[0];
            return {
                id: task.id,
                title: task.title,
                type: task.type,
                duration: task.duration,
                order: task.order,
                content: task.content,
                isCompleted: completion?.isCompleted || false,
                isStarted: !!completion,
                score: completion?.score || null,
                timeSpent: completion?.timeSpent || null,
                metadata: task.metadata
            };
        });

        const allCompleted = formattedTasks.length > 0 && formattedTasks.every((t: any) => t.isCompleted);

        const dayData = {
            module: {
                id: module.id,
                dayNumber: module.dayNumber,
                title: module.title,
                description: module.description,
                content: module.content
            },
            tasks: formattedTasks,
            allCompleted
        };

        // Return with caching headers
        return NextResponse.json(dayData, {
            headers: {
                'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
            }
        });

    } catch (error) {
        console.error('Error fetching day data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
