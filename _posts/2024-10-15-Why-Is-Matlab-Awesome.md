---
layout: post
title: "Is Matlab Awesome, or Should I just do it in Python?"
date: 2024-10-15 12:00:00 +0000
tags: [MATLAB, system-engineering, mechanical-engineering]
description: "A brief exploration into some of MATLAB's features."
reading_time: 10
---

![MATLAB Art by Me](/assets/Screenshot 2025-04-17 at 12.55.06 PM.png)

# What is MATLAB? Why do we need a math programming language?

MATLAB was created by a professor in New Mexico in the 1970s to address the demands of his students to compute easy matrix operations using software. <br>

Short for "MATrix LABoratory", this was a collection of linear algebra libraries that students could call to solve difficult problems. <br>

Since then MATLAB has not looked back and has continued to develop new libararies and tools to help mathamaticians and engineers solve difficult problems. <br>

During my undergrad at University of California, San Diego, I used MATLAB quite a bit to solve common mechanical engineering problems in statics, dynamics, and fluids. Expecially, whenever linear algebra was involved, the default was to use MATLAB. It's just super easy and efficient at solving large matrix equations, which allowed me to have the time to focus on the actual engineering problem and not the computation problem. 

![MATLAB Airplane Simulation](/assets/ezgif-32a7129a03fb76.gif)

## MATLAB libraries Examples


Don't wanna hand convert coordinates to polar coordinates? Just call this function instead!
```MATLAB
%--------------------------------------------------------------------------
%
% Calculate polar components
%
% Last modified:   2018/01/27   Meysam Mahooti
%
%--------------------------------------------------------------------------
function [m_phi, m_theta, m_r] = CalcPolarAngles(m_Vec)
% Length of projection in x-y-plane:
rhoSqr = m_Vec(1) * m_Vec(1) + m_Vec(2) * m_Vec(2); 
% Norm of vector
m_r = sqrt(rhoSqr + m_Vec(3) * m_Vec(3));
% Azimuth of vector
if ( (m_Vec(1)==0) && (m_Vec(2)==0) )
    m_phi = 0;
else
    m_phi = atan2(m_Vec(2), m_Vec(1));
end
if ( m_phi < 0 )
    m_phi = m_phi + 2*pi;
end
% Altitude of vector
rho = sqrt( rhoSqr );
if ( (m_Vec(3)==0) && (rho==0) )
    m_theta = 0;
else
    m_theta = atan2(m_Vec(3), rho);
end
```

When in doubt, ode45 it out. Solve differential equations with the call of a function
```MATLAB
% Define the ODE function
function dydt = myODE(t, y)
    dydt = -2 * y;
end

% Set up the problem
tspan = [0 5];  % Time interval from 0 to 5
y0 = 1;         % Initial condition y(0) = 1

% Solve the ODE
[t, y] = ode45(@myODE, tspan, y0);

% Plot the results
plot(t, y);
xlabel('Time');
ylabel('y(t)');
title('Solution of dy/dt = -2y');
```


## Simulink

Simulink takes the powerful MATLAB libararies that it offers and allows you to create dynamic models with inputs and outputs. <br>

I first got exposure to Simulink making controls diagrams that would simulate balancing a ball using a PID controller. <br>

![Simulink PID Controller]({{ site.baseurl }}/assets/pid controller.jpg "Simulink PID Controller")

## MATLAB Tool Box

When I was working as a system engineer, I quite frequently used the MATLAB Radar Toolbox. <br>

I found it very useful to not only help me compute radar equations like the Signal-to-Noise Ratiol, but it was very effective at creating visualizations so I could effectively communicate my results with both my manager and various stakeholders. <br>

![MATLAB Radar Toolbox]({{ site.baseurl }}/assets/radar-toolbox-overview-489472295.jpg "MATLAB Radar Toolbox")

## Excellent Documentation

MATLAB documentation is world renowned. If you have a problem, MATLAB will have the answer.

[MATLAB Documentation](https://www.mathworks.com/matlabcentral/answers/index/?s_tid=gn_mlc_an)


## Convert to Low Level C

Python users (myself included) usually criticize MATLAB for being expensive, not as open-source as python, and catered specifically only for large engineering companies. <br>

While all these critiques are true, and it is usually better to  individually code small projects with python, MATLAB has the advantage of converting your MATLAB code to be run in C++ to get better performance than python.

[MATLAB C++](https://www.mathworks.com/help/matlab/cpp-language.html?s_tid=CRUX_lftnav)


