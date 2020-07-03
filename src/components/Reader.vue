<template>
  <div class="hello">
    <div v-if="Object.keys(blobUrls).length === 0 && !isReading" style="padding:20vh 0">
      <div v-if="!openQR">
        Open the camera and read the QR code card<br><br>
      </div>
      <b-button v-if="!openQR" type="is-primary" v-on:click="showQR" size="is-large">OPEN CAMERA</b-button>
      <qrcode-stream v-if="openQR" @decode="onDecode"></qrcode-stream>
    </div>
    <div v-if="isReading" style="padding:25vh 0">Reading card, please wait...</div>
    <div v-if="Object.keys(blobUrls).length > 0 && !isReading">
      <h3>Select a file to read:</h3>
      <b-select v-model="selectedFile" placeholder="Select a file first">
        <option v-for="name in names" v-bind:key="name" :value="name">{{ name }}</option>
      </b-select>
      <div v-if="selectedFile">
        <hr>
        <pdf
          :src="files[selectedFile].blob"
          @num-pages="pageCount = $event"
          @page-loaded="currentPage = $event"
          :page = "currentPage"
        ></pdf><br>
        {{currentPage}} / {{pageCount}}
        <div v-if="pageCount > 1" style="margin-top:-23px; padding-bottom:30px;">
          <b-button v-on:click="decreasePage" style="float:left" type="is-primary" size="is-small"><b-icon icon="arrow-left" size="is-small"></b-icon></b-button>
          <b-button v-on:click="increasePage" style="float:right" type="is-primary" size="is-small"><b-icon icon="arrow-right" size="is-small"></b-icon></b-button>
        </div>
        <hr>
        <br>
        <b-button v-on:click="savePDF" style="width:100%" type="is-primary" size="is-large">SAVE PDF FILE</b-button>
        <a :href="files[selectedFile].proof" target="_blank">
          <b-button type="is-success" style="width:100%" size="is-large">OPEN PROOF</b-button>
        </a>
      </div>
    </div>
  </div>
</template>


<script>
  const ScryptaCore = require('@scrypta/core');
  const axios = require('axios');
  const FileType = require('file-type/browser');
  const crypto = require('crypto');
  const LZUTF8 = require('lzutf8')
  import pdf from 'vue-pdf'

  export default {
    components: {
      pdf
    },
    name: 'Reader',
    watch: {
      selectedFile: function () {
        this.currentPage = 1
      }
    },
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        axios: axios,
        FileType: FileType,
        files: {},
        blobUrls: [],
        currentPage: 1,
        pageCount: 0,
        names: [],
        selectedFile: '',
        boatpwd: '',
        isReading: false,
        openQR: false,
        address: ''
      }
    },
    async mounted() {
      const app = this
      app.wallet = await app.scrypta.returnDefaultIdentity()
      let SIDS = app.wallet.split(':')
      app.address = SIDS[0]
      let identity = await app.scrypta.returnIdentity(app.address)
      app.wallet = identity
    },
    methods: {
      showQR(){
        this.openQR = true
      },
      decreasePage(){
        const app = this
        if(app.currentPage > 1){
          app.currentPage = app.currentPage - 1
        }
      },
      increasePage(){
        const app = this
        if(app.currentPage < app.pageCount){
          app.currentPage = app.currentPage + 1
        }
      },
      async onDecode (decodedString) {
        const app = this
        let SIDS = decodedString.split(':')
        let address = SIDS[0]
        app.address = address
        let readed = await app.scrypta.post('/read', { address: address, protocol: 'register://' })
        app.isReading = true
        app.openQR = false
        if(readed.data.length > 0){
          for(let z in readed.data){
            let message = readed.data[z].data
            if(message.pubKey !== undefined && message.signature !== undefined && message.message !== undefined){
              let Certificate = JSON.parse(readed.data[z].data.message)
              let verify = await app.scrypta.verifyMessage(message.pubKey, message.signature, message.message)
              if(verify !== false && Certificate.file !== undefined){
                app.blockchainUrl = 'https://proof.scryptachain.org/#/uuid/' + readed.data[z].uuid
                let original = await app.axios.get('https://'+ readed.data[z].collection+'.digitaloceanspaces.com/' + address + '/' + Certificate.file, {responseType: 'arraybuffer'})
                let ft = await FileType.fromBuffer(original.data)
                let checkhash = crypto.createHash("sha256").update(Buffer(original.data)).digest("hex")
                let name = LZUTF8.decompress(Certificate.title, { inputEncoding: 'Base64' })
                if(Certificate.file === checkhash && app.names.indexOf(name) === -1) {
                  app.names.push(name)
                  let blob = new Blob([original.data], { type: ft.mime })
                  var blobUrl = URL.createObjectURL(blob)
                  app.blobUrls.push({
                    blob: blobUrl,
                    filename: name
                  })
                  if(app.selectedFile === ''){
                    app.selectedFile = name
                  }
                  app.files[name] = {
                    blob: blobUrl,
                    filename: name,
                    hash: Certificate.file,
                    endpoint: readed.data[z].collection,
                    proof: 'https://proof.scryptachain.org/#/uuid/' + readed.data[z].uuid
                  }
                }
              }
            }
          }
          app.isReading = false
        } else {
          app.$buefy.toast.open({
            message: "Nothing to read.",
            type: "is-danger"
          });
        } 
      },
     async savePDF(){
        const app = this
        let original = await app.axios.get('https://'+app.files[app.selectedFile].endpoint+'.digitaloceanspaces.com/' + app.address + '/' + app.files[app.selectedFile].hash,{responseType: 'arraybuffer'})
        let ft = await FileType.fromBuffer(original.data)
        let checkhash = crypto.createHash("sha256").update(Buffer(original.data)).digest("hex")
        if(app.files[app.selectedFile].hash === checkhash){
          let blob = new Blob([original.data], { type: ft.mime })
          var blobUrl = URL.createObjectURL(blob)
          const app = this
          var a = document.createElement("a");
          document.body.appendChild(a);
          a.style = "display: none";
          a.href = blobUrl;
          a.download = app.selectedFile + '.' + ft.ext;
          a.click();
        }else{
          app.$buefy.toast.open({
              message: "File is corrupted!",
              type: "is-danger"
            })
        }
      }
    }
  }
</script>