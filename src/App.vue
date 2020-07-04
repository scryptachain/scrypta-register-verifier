<template>
  <div id="app">
      <b-navbar>
        <template slot="brand">
          <b-navbar-item tag="router-link" :to="{ path: '/' }">
            <img src="/logo.png" style="margin-right:15px" />
            <b>Scrypta Documenta</b>
          </b-navbar-item>
        </template>
      </b-navbar>
      <router-view />
      <hr />Scrypta Docuemnta<br>developed by
      <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
      <br />
      <br />
    
  </div>
</template>

<style>
  .navbar-burger {
    display:none!important;
  }
  body{
    text-align: center;
  }
</style>