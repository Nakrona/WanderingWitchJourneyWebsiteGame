// ============================================================
// Skill2.cs - OOP Implementation for Skill 2 Projectile
// Key: X | Cooldown: 1.5 seconds | Source: Skill2.gif
// ============================================================

using System;

public class Skill2
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; } = 52f;
    public float Height { get; set; } = 40f;
    public float Speed { get; set; } = 9f;
    public float DirX { get; set; }
    public float DirY { get; set; }
    public float Vx => DirX * Speed;
    public float Vy => DirY * Speed;
    public bool IsAlive { get; set; } = true;
    public string ImageSrc { get; set; } = "Skill2.gif";

    public Skill2(float startX, float startY, float directionX, float directionY = 0f)
    {
        X = startX;
        Y = startY;
        DirX = directionX;
        DirY = directionY;
        IsAlive = true;
    }

    public void Update(float canvasWidth, float canvasHeight)
    {
        X += Vx;
        Y += Vy;

        if (X < -Width - 20 || X > canvasWidth + 20 || Y < -Height - 20 || Y > canvasHeight + 20)
        {
            Destroy();
        }
    }

    public bool CheckCollisionWithSpike(float spikeX, float spikeY, float spikeW, float spikeH)
    {
        return X < spikeX + spikeW &&
               X + Width > spikeX &&
               Y < spikeY + spikeH &&
               Y + Height > spikeY;
    }

    public void Destroy()
    {
        IsAlive = false;
    }
}
