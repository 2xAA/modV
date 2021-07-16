<template>
  <div>
    <img src="../../../build/icon@2x.png" />
  </div>
</template>

<style>
html,
body {
  overflow: hidden;
}

img {
  width: 100%;
  animation: 4s forwards fade-scale;
}

@keyframes fade-scale {
  0% {
    transform: scale(0.8) rotate(-10deg);
    opacity: 0;
  }

  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
</style>
