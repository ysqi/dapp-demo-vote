// --------------- utils  -------------
String.prototype.format = function () {
    var s = this;
    for (var i = 0; i < arguments.length; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i]);
    }
    return s;
}
// --------------- utils  end -------------


App = {
    provider: {},
    contract: {},

    init: async function () {
        try {
            $('.toast').toast('show', { delay: 10000 });
            App.bindEvents();
            await App.initContract()
            await App.loadPhotos();
        } catch (error) {
            App.handleError(error)
        }
    },
    initContract: async function () {
        // Default: http://localhost:8545
        App.provider = new ethers.providers.JsonRpcProvider();
        return App.provider.getBlockNumber().then(() => {
            //初始化合约信息
            return $.getJSON("/PhotoVote.json", function (data) {
                let versions = Object.keys(data.networks);
                if (versions.length == 0) {
                    App.handleError("合约尚未部署到网络中，请执行 truffle deploy 进行部署");
                    return;
                }
                let last = data.networks[versions[versions.length - 1]];
                App.contract = new ethers.Contract(last.address, data.abi, App.provider);
            })
        }).then(() => {
            return App.provider.listAccounts()
        }).then(accounts => {
            App.accounts = accounts.sort();
            $.each(accounts, function (i, item) {
                App.provider.getBalance(item).then(b => {
                    $("#wallets").append($("<option>", {
                        value: item,
                        selected: i == 0,
                        text: item + "   <" + ethers.utils.formatUnits(b, "ether") + " ETH>"
                    }))
                    if (i == 0) {
                        App.onWalletChanged();
                    }
                })
            })

        }).catch((err) => {
            throw "获取网络失败：" + err.message + "，无法访问 JSON RPC：http://localhost:8545";
        });
    },

    switchView: function () {
        $("#forms").toggle();
        $("#photoview").toggle();
    },
    bindEvents: function () {
        // 绑定事件
        $(".cancelJoin").on('click', App.switchView);
        $(".joinLink").on('click', App.switchView);
        $("#joinForm").submit(App.handleJoin);
        // 投票按钮
        $(document).on('click', ".btn-lovePhoto", App.handleLove);
        $("#wallets").change(App.onWalletChanged);
    },
    onWalletChanged: function () {
        App.signer = App.provider.getSigner($("#wallets").val());
    },

    loadPhotos: async function () {
        $(".photoList").find(".spinner-border").show();
        return App.fetchPhotos().then((data) => {
            var listObj = $(".photoList:first");
            listObj.find(".col-card").remove();
            data.forEach(function (value, index) {
                var tpl = `<div class="col-card col-md-{4} mt-3">
                <div class="card " >
                    <img src="{0}" class="card-img-top img-thumbnail" style="max-height:400px">
                    <div class="card-body">
                    <p class="card-text">{1}</p>
                    <span><span class="photo-vote">{2}</span>票</span>
                    <button type="button" class="btn btn-link btn-lovePhoto"
                    data-id="{3}" data-votes="{2}">被感动</button>
                    </div>
                </div></div>
                `
                listObj.append(tpl.format(
                    value.url, value.story, value.votes, value.id,
                    index == 0 ? 6 : (index == 1 ? 5 : 4)
                ));
            })
            $(".photoList").find(".spinner-border").hide();
        })


    },

    handleLove: async function (event) {
        event.preventDefault();
        let btn = $(event.target)
        let id = parseInt(btn.data('id'));

        App.contract.connect(App.signer).vote(id).then(() => {
            //简单化+1
            // let votes =parseInt(btn.data('votes')+1)
            // btn.data("votes",votes);
            // btn.parent().find(".photo-vote").text(votes)
            // btn.attr("disabled", true);
            App.loadPhotos();
        }).catch(err => {
            alert("投票失败：" + err.message)
        });
    },
    handleJoin: async function (event) {
        event.preventDefault();
        var btn = $(event.currentTarget).find("button[type=submit]");
        btn.find(".spinner-border").toggleClass("invisible", "visible")

        var data = $(event.currentTarget).serializeArray().reduce(function (obj, item) {
            obj[item.name] = item.value;
            return obj;
        }, {});;

        return App.contract.connect(App.signer).join(data.photo, data.story).then((result) => {
            console.log("result", result)
            btn.find(".spinner-border").toggleClass("invisible", "visible")
            $(event.currentTarget)[0].reset();
        }).then(App.loadPhotos).then(App.switchView)
    },

    handleError: function (error) {
        let tpl = ` <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">发生错误!</h4>
        <p>{0}</p>
      </div>`
        $(tpl.format(error)).replaceAll('.contentContainer');

    },

    fetchPhotos: async function () {
        var photos = []
        try {
            for (var i = 0; ; i++) {
                let info = await App.contract.photos(i);
                photos.push(info);
            }
        } catch (error) {
            //如果不存在，则将调用失败。忽略此错误
        }
        //根据投票数排序
        return photos.sort(function (a, b) {
            if (a.votes.lt(b.votes)) {
                return 1;
            } else if (a.votes.eq(b.votes)) {
                return 0;
            } else {
                return -1;
            }
        })
    },
}


$(document).ready(function () {
    App.init();
});